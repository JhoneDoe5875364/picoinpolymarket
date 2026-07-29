"""Reconcile APPROVED payments that never got completed by the client.

A buy settles only when the browser's Pi SDK calls /pi/payments/complete after
the user signs the on-chain transfer. If the user closes the tab, loses network,
or the complete request fails, the payment is stuck APPROVED forever: the trade,
position and price are never recorded, and Pi blocks the user's next payment
("Pending Payment Found").

This periodic task closes that gap server-side. For each stale APPROVED payment
it asks Pi for the authoritative payment DTO and:
  - transaction_verified on-chain  -> settle it (same steps as complete route)
  - cancelled / user_cancelled     -> mark CANCELLED, order FAILED
  - old and still unverified        -> cancel with Pi, then mark CANCELLED

It reuses the exact settlement logic from the complete route so results are
identical whether the client finished the flow or the server reconciled it.
"""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core import pi_client
from app.core.logger import get_logger
from app.core.market import insert_market_trade, update_market_position, update_market_price
from app.repositories import payments as payments_repo

logger = get_logger()

# How often to sweep for stuck payments.
RECONCILE_INTERVAL_SECONDS = int(os.getenv("PAYMENT_RECONCILE_INTERVAL_SECONDS", "120"))
# Leave a payment alone until it has been APPROVED this long — the user may still
# be signing. Below this, do not touch it.
RECONCILE_MIN_AGE_SECONDS = int(os.getenv("PAYMENT_RECONCILE_MIN_AGE_SECONDS", "180"))
# After this long with no verified transaction, give up and cancel so the user
# is unblocked for new payments.
RECONCILE_CANCEL_AFTER_SECONDS = int(os.getenv("PAYMENT_RECONCILE_CANCEL_AFTER_SECONDS", "3600"))
RECONCILE_BATCH_LIMIT = 50


async def _settle_verified(session: AsyncSession, payment: dict, dto: dict, txid: str) -> bool:
    """Settle a verified payment exactly like POST /pi/payments/complete."""
    order_id = payment["order_id"]
    user_id = int(payment["user_id"])
    async with session.begin():
        order = await payments_repo.get_order_for_update(
            session, order_id=order_id, user_id=user_id
        )
        if order is None:
            logger.error("[RECONCILE] order %s missing for payment %s", order_id, payment["pi_payment_id"])
            return False
        if order.status != "PENDING":
            # Order already settled elsewhere; just flip the payment row.
            await payments_repo.mark_completed(
                session, pi_payment_id=payment["pi_payment_id"], txid=txid, raw_payload=dto
            )
            return True

        completed = await payments_repo.mark_completed(
            session, pi_payment_id=payment["pi_payment_id"], txid=txid, raw_payload=dto
        )
        if completed is None:
            return False  # already completed by a concurrent path

        trade = await insert_market_trade(
            session,
            user_id,
            int(order.market_id),
            str(order.outcome),
            Decimal(str(order.size)),
            datetime.now(timezone.utc),
        )
        await update_market_position(session, trade)
        await update_market_price(session, trade)
        await payments_repo.set_order_status(session, order_id=order_id, status="EXECUTED")
    return True


async def _cancel_stuck(session: AsyncSession, payment: dict) -> None:
    """Cancel with Pi (best effort), then mark CANCELLED and fail the order."""
    pid = payment["pi_payment_id"]
    try:
        await pi_client.cancel_payment(pid)
    except Exception as exc:  # noqa: BLE001 - Pi may already consider it gone
        logger.warning("[RECONCILE] Pi cancel failed for %s: %s", pid, exc)
    async with session.begin():
        await payments_repo.mark_cancelled(session, pi_payment_id=pid)
        await payments_repo.set_order_status(session, order_id=payment["order_id"], status="FAILED")


async def reconcile_once(session: AsyncSession) -> dict[str, int]:
    stats = {"settled": 0, "cancelled": 0, "skipped": 0, "errors": 0}

    rows = await payments_repo.list_approved_for_reconcile(
        session, older_than_seconds=RECONCILE_MIN_AGE_SECONDS, limit=RECONCILE_BATCH_LIMIT
    )
    await session.rollback()  # close the autobegun read tx before write tx below
    if not rows:
        return stats

    now = datetime.now(timezone.utc)
    for payment in rows:
        pid = payment["pi_payment_id"]
        try:
            dto = await pi_client.get_payment(pid)
        except Exception as exc:  # noqa: BLE001
            logger.warning("[RECONCILE] get_payment failed for %s: %s", pid, exc)
            stats["errors"] += 1
            continue

        status = dto.get("status") or {}
        txid = (dto.get("transaction") or {}).get("txid")

        if status.get("transaction_verified") and txid:
            try:
                ok = await _settle_verified(session, payment, dto, str(txid))
                stats["settled" if ok else "skipped"] += 1
                if ok:
                    logger.info("[RECONCILE] settled stuck payment %s (order %s)", pid, payment["order_id"])
            except Exception as exc:  # noqa: BLE001
                logger.error("[RECONCILE] settle failed for %s: %s", pid, exc)
                await session.rollback()
                stats["errors"] += 1
            continue

        if status.get("cancelled") or status.get("user_cancelled"):
            await _cancel_stuck(session, payment)
            stats["cancelled"] += 1
            logger.info("[RECONCILE] cancelled (Pi-cancelled) payment %s", pid)
            continue

        # Unverified and not cancelled: only give up once it is old enough.
        created = payment["created_at"]
        age = (now - created).total_seconds() if created else 0
        if age >= RECONCILE_CANCEL_AFTER_SECONDS:
            await _cancel_stuck(session, payment)
            stats["cancelled"] += 1
            logger.info("[RECONCILE] cancelled stale payment %s (age %ss)", pid, int(age))
        else:
            stats["skipped"] += 1

    return stats


async def run_periodic_payment_reconcile(
    session_maker: async_sessionmaker[AsyncSession],
    interval_seconds: int = RECONCILE_INTERVAL_SECONDS,
) -> None:
    while True:
        async with session_maker() as session:
            try:
                stats = await reconcile_once(session)
                if any(stats[k] for k in ("settled", "cancelled", "errors")):
                    logger.info(
                        "[RECONCILE] sweep: settled=%s cancelled=%s skipped=%s errors=%s",
                        stats["settled"], stats["cancelled"], stats["skipped"], stats["errors"],
                    )
            except Exception:
                await session.rollback()
                logger.exception("[RECONCILE] sweep failed")
        await asyncio.sleep(interval_seconds)


async def _run_once_cli() -> None:
    """One-shot reconcile for manual runs: python -m app.updator.payment_reconcile_updater"""
    from app.db.session import create_engine_and_sessionmaker

    _engine, session_maker = create_engine_and_sessionmaker()
    async with session_maker() as session:
        stats = await reconcile_once(session)
    print(f"[RECONCILE] one-shot: {stats}")


if __name__ == "__main__":
    asyncio.run(_run_once_cli())

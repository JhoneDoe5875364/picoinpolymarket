"""Payment rows binding a Pi payment to the order it settles.

A payment is created only once the Pi SDK has issued a `paymentId`, which is at
`onReadyForServerApproval`. Before that point there is nothing to record: Pi, not
us, mints the payment. See docs/feedbacks/20260621_Payment_Trade_Binding_Design.ko.md.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.order import Order
from app.models.tables.payment import Payment
from app.models.tables.user import User


def _to_dict(row: Payment) -> dict[str, Any]:
    return {
        "id": row.id,
        "order_id": row.order_id,
        "user_id": row.user_id,
        "amount": row.amount,
        "currency": row.currency,
        "status": row.status,
        "pi_payment_id": row.pi_payment_id,
        "txid": row.txid,
    }


async def get_order_for_update(
    session: AsyncSession, *, order_id: int, user_id: int
) -> Optional[Order]:
    """Lock the order row so two concurrent payments cannot both consume it."""
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.user_id == user_id)
        .with_for_update()
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_pi_uid(session: AsyncSession, *, user_id: int) -> Optional[str]:
    result = await session.execute(select(User.pi_uid).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_by_pi_payment_id(
    session: AsyncSession, *, pi_payment_id: str
) -> Optional[dict[str, Any]]:
    result = await session.execute(
        select(Payment).where(Payment.pi_payment_id == pi_payment_id)
    )
    row = result.scalar_one_or_none()
    return _to_dict(row) if row else None


async def create_approved(
    session: AsyncSession,
    *,
    order_id: int,
    user_id: int,
    amount: Decimal,
    pi_payment_id: str,
    raw_payload: dict[str, Any],
) -> Optional[dict[str, Any]]:
    """Insert the APPROVED payment row.

    Returns None when `pi_payment_id` is already recorded: the partial UNIQUE
    index makes the second insert a no-op, which is exactly the replay guard we
    want. Callers treat None as "this payment was already used".
    """
    stmt = (
        pg_insert(Payment)
        .values(
            order_id=order_id,
            user_id=user_id,
            amount=amount,
            currency="PI",
            status="APPROVED",
            pi_payment_id=pi_payment_id,
            raw_payload=raw_payload,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        # uq_payments_pi_payment_id is a *partial* index; Postgres only matches an
        # ON CONFLICT target when its predicate is restated here.
        .on_conflict_do_nothing(
            index_elements=[Payment.pi_payment_id],
            index_where=Payment.pi_payment_id.isnot(None),
        )
        .returning(Payment)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return _to_dict(row) if row else None


async def mark_completed(
    session: AsyncSession,
    *,
    pi_payment_id: str,
    txid: str,
    raw_payload: dict[str, Any],
) -> Optional[dict[str, Any]]:
    """Flip APPROVED -> COMPLETED and pin the txid.

    The `status == "APPROVED"` predicate makes this idempotent: a replayed
    completion matches no row and returns None.
    """
    stmt = (
        update(Payment)
        .where(
            Payment.pi_payment_id == pi_payment_id,
            Payment.status == "APPROVED",
        )
        .values(
            status="COMPLETED",
            txid=txid,
            raw_payload=raw_payload,
            updated_at=datetime.now(timezone.utc),
        )
        .returning(Payment)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return _to_dict(row) if row else None


async def mark_cancelled(session: AsyncSession, *, pi_payment_id: str) -> None:
    await session.execute(
        update(Payment)
        .where(
            Payment.pi_payment_id == pi_payment_id,
            Payment.status.in_(("PENDING", "APPROVED")),
        )
        .values(status="CANCELLED", updated_at=datetime.now(timezone.utc))
    )


async def set_order_status(
    session: AsyncSession, *, order_id: int, status: str
) -> None:
    await session.execute(
        update(Order)
        .where(Order.id == order_id)
        .values(status=status, updated_at=datetime.now(timezone.utc))
    )

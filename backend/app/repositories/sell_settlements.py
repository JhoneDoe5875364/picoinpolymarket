"""Ledger writes for user-initiated sells settled via A2U payout.

A sell is idempotent on the client-generated ``sell_request_id``: a retried
request finds the existing row (via ``get_by_request_id``) and the route returns
the prior result instead of sending Pi a second time.

The SELL ``orders`` row is inserted here (not via ``orders.create_order``, which
commits internally) so the caller keeps full control of the transaction boundary.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import func, insert, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.order import Order
from app.models.tables.sell_settlement import SellSettlement


def _to_dict(row: SellSettlement) -> dict[str, Any]:
    return {
        "id": row.id,
        "sell_request_id": row.sell_request_id,
        "order_id": row.order_id,
        "position_id": row.position_id,
        "user_id": row.user_id,
        "market_id": row.market_id,
        "outcome": row.outcome,
        "sell_shares": float(row.sell_shares),
        "price": float(row.price),
        "net_payout": float(row.net_payout),
        "status": row.status,
        "payout_txid": row.payout_txid,
        "failure_reason": row.failure_reason,
    }


async def count_recent_sells(
    session: AsyncSession, *, user_id: int, window_seconds: int
) -> int:
    """How many sells this user started within the last `window_seconds`.

    Counts every non-terminal-failed attempt (PENDING/PAYING/SETTLED) so a burst
    of requests cannot bypass the limit by racing. Used for the V7 rate limit.
    """
    since = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
    result = await session.execute(
        select(func.count())
        .select_from(SellSettlement)
        .where(
            SellSettlement.user_id == user_id,
            SellSettlement.created_at >= since,
            SellSettlement.status != "FAILED",
        )
    )
    return int(result.scalar_one() or 0)


async def get_by_request_id(
    session: AsyncSession, *, sell_request_id: str
) -> Optional[dict[str, Any]]:
    """Return the existing settlement for this idempotency key, or None."""
    result = await session.execute(
        select(SellSettlement).where(
            SellSettlement.sell_request_id == sell_request_id
        )
    )
    row = result.scalar_one_or_none()
    return _to_dict(row) if row else None


async def create_sell_order(
    session: AsyncSession,
    *,
    user_id: int,
    market_id: int,
    token: str,
    outcome: str,
    price: Decimal,
    shares: Decimal,
) -> Order:
    """Insert a PENDING SELL order as the audit anchor. No implicit commit."""
    now = datetime.now(timezone.utc)
    stmt = (
        insert(Order)
        .values(
            user_id=user_id,
            market_id=market_id,
            token=token,
            side="SELL",
            outcome=outcome,
            price=price,
            size=shares,
            pi_amount=(price * shares),
            status="PENDING",
            created_at=now,
            updated_at=now,
        )
        .returning(Order)
    )
    result = await session.execute(stmt)
    order = result.scalar_one_or_none()
    if order is None:
        raise ValueError("Failed to create sell order")
    return order


async def create_reserved(
    session: AsyncSession,
    *,
    sell_request_id: str,
    order_id: int,
    position_id: int,
    user_id: int,
    market_id: int,
    outcome: str,
    sell_shares: Decimal,
    price: Decimal,
    net_payout: Decimal,
    status: str = "PAYING",
) -> Optional[dict[str, Any]]:
    """Insert the settlement row idempotently.

    Uses ``ON CONFLICT (sell_request_id) DO NOTHING`` so two concurrent requests
    carrying the SAME idempotency key cannot both create a row: the loser's
    insert returns no row, and the caller treats that as "already in progress"
    WITHOUT sending Pi a second time. This is the atomic replacement for the old
    "read-then-insert" check that had a race window.

    Returns the inserted row, or None when the key already existed.
    """
    now = datetime.now(timezone.utc)
    stmt = (
        pg_insert(SellSettlement)
        .values(
            sell_request_id=sell_request_id,
            order_id=order_id,
            position_id=position_id,
            user_id=user_id,
            market_id=market_id,
            outcome=outcome,
            sell_shares=sell_shares,
            price=price,
            net_payout=net_payout,
            status=status,
            created_at=now,
            updated_at=now,
        )
        .on_conflict_do_nothing(index_elements=[SellSettlement.sell_request_id])
        .returning(SellSettlement)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return _to_dict(row) if row else None


async def mark_settled(
    session: AsyncSession, *, sell_request_id: str, txid: str
) -> None:
    await session.execute(
        update(SellSettlement)
        .where(SellSettlement.sell_request_id == sell_request_id)
        .values(
            status="SETTLED",
            payout_txid=txid,
            updated_at=datetime.now(timezone.utc),
        )
    )


async def mark_failed(
    session: AsyncSession,
    *,
    sell_request_id: str,
    reason: str,
    txid: Optional[str] = None,
) -> None:
    """Mark a settlement FAILED.

    ``txid`` is recorded when Pi WAS sent but the follow-up DB write failed, so an
    operator can reconcile: money left the wallet but the position was not reduced.
    """
    values: dict[str, Any] = {
        "status": "FAILED",
        "failure_reason": reason[:2000],
        "updated_at": datetime.now(timezone.utc),
    }
    if txid:
        values["payout_txid"] = txid
    await session.execute(
        update(SellSettlement)
        .where(SellSettlement.sell_request_id == sell_request_id)
        .values(**values)
    )

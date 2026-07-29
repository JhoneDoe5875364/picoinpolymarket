from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.market_position import MarketPosition


async def get_market_snapshot_prices(
    session: AsyncSession, market_id: int
) -> dict[str, Any]:
    q = text(
        """
        SELECT id, title, yes_pct, no_pct, status
        FROM v_market_snapshots
        WHERE id = :mid
        """
    )
    r = await session.execute(q, {"mid": market_id})
    row = r.mappings().first()
    if not row:
        raise LookupError("Market not found")
    d = dict(row)
    if d.get("status") != "open":
        raise ValueError("Market is not open")
    if d.get("yes_pct") is None or d.get("no_pct") is None:
        raise ValueError("Missing market prices")
    yes_price = float(d["yes_pct"]) / 100.0
    no_price = float(d["no_pct"]) / 100.0
    if yes_price <= 0 or no_price <= 0:
        raise ValueError("Invalid market prices")
    return {
        "id": d["id"],
        "title": d.get("title", ""),
        "yes_price": yes_price,
        "no_price": no_price,
    }


async def lock_position(
    session: AsyncSession, *, position_id: int, user_id: int
) -> Optional[MarketPosition]:
    """Lock a position row (FOR UPDATE) so concurrent sells can't both consume it.

    Returns None if the position does not exist or belongs to another user.
    """
    stmt = (
        select(MarketPosition)
        .where(
            MarketPosition.id == position_id,
            MarketPosition.user_id == user_id,
        )
        .with_for_update()
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_market_position_snapshot(
    session: AsyncSession,
    *,
    market_id: int,
    user_id: int,
    outcome: str,
) -> dict[str, Any]:
    stmt = select(MarketPosition).where(
        MarketPosition.market_id == market_id,
        MarketPosition.user_id == user_id,
        MarketPosition.outcome == outcome,
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    if row is None:
        raise RuntimeError("Failed to load created position")
    return {
        "id": row.id,
        "market_id": row.market_id,
        "user_id": row.user_id,
        "outcome": row.outcome,
        "shares": float(row.shares),
        "pi_amount": float(row.pi_amount),
        "avg_price": float(row.avg_price),
    }

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.market import Market
from app.models.tables.market_watchlist import MarketWatchlist


async def market_exists(session: AsyncSession, market_id: int) -> bool:
    row = await session.execute(select(Market.id).where(Market.id == market_id))
    return row.scalar_one_or_none() is not None


async def toggle_watchlist(
    session: AsyncSession,
    *,
    user_id: int,
    market_id: int,
) -> dict[str, Any]:
    if not await market_exists(session, market_id):
        raise LookupError("Market not found")

    existing = await session.execute(
        select(MarketWatchlist).where(
            MarketWatchlist.user_id == user_id,
            MarketWatchlist.market_id == market_id,
        )
    )
    row = existing.scalar_one_or_none()
    now_utc = datetime.now(timezone.utc)

    if row is not None:
        await session.execute(
            delete(MarketWatchlist).where(
                MarketWatchlist.user_id == user_id,
                MarketWatchlist.market_id == market_id,
            )
        )
        watched = False
    else:
        session.add(
            MarketWatchlist(
                user_id=user_id,
                market_id=market_id,
                created_at=now_utc,
            )
        )
        watched = True

    await session.flush()
    return {"watched": watched, "market_id": market_id}


async def list_watchlisted_market_ids(
    session: AsyncSession,
    *,
    user_id: int,
    offset: int = 0,
    limit: Optional[int] = 20,
) -> list[int]:
    stmt = (
        select(MarketWatchlist.market_id)
        .where(MarketWatchlist.user_id == user_id)
        .order_by(MarketWatchlist.created_at.desc(), MarketWatchlist.market_id.desc())
        .offset(offset)
    )
    if limit is not None:
        stmt = stmt.limit(limit)
    rows = await session.execute(stmt)
    return [int(market_id) for market_id in rows.scalars().all()]


async def watchlisted_ids_for_markets(
    session: AsyncSession,
    *,
    user_id: int,
    market_ids: list[int],
) -> set[int]:
    if not market_ids:
        return set()
    rows = await session.execute(
        select(MarketWatchlist.market_id).where(
            MarketWatchlist.user_id == user_id,
            MarketWatchlist.market_id.in_(market_ids),
        )
    )
    return {int(market_id) for market_id in rows.scalars().all()}


async def is_watchlisted(
    session: AsyncSession,
    *,
    user_id: int,
    market_id: int,
) -> bool:
    row = await session.execute(
        select(MarketWatchlist.market_id).where(
            MarketWatchlist.user_id == user_id,
            MarketWatchlist.market_id == market_id,
        )
    )
    return row.scalar_one_or_none() is not None


async def watchlist_count(session: AsyncSession, *, user_id: int) -> int:
    row = await session.execute(
        select(func.count())
        .select_from(MarketWatchlist)
        .where(MarketWatchlist.user_id == user_id)
    )
    return int(row.scalar_one() or 0)

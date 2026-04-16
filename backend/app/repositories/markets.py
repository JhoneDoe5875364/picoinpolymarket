from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional, Union

from sqlalchemy import func, inspect as sa_inspect, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.tables.market import Market
from app.models.tables.market_holder import MarketHolder
from app.models.tables.market_price_candles import MarketPriceCandle

_ORDER_COLUMNS: dict[str, Any] = {
    "created_at": Market.created_at,
    "updated_at": Market.updated_at,
    "start_date": Market.start_date,
    "end_date": Market.end_date,
    "volume": Market.volume,
}


def market_to_dict(m: Market) -> dict[str, Any]:
    """Return mapped ``Market`` columns plus ``category`` slug (when relationship is loaded)."""
    d = {col.key: getattr(m, col.key) for col in sa_inspect(Market).mapper.columns}
    cr = m.category
    d["category"] = cr.slug if cr is not None else None
    return d


async def list_markets(
    session: AsyncSession,
    *,
    limit: Optional[int] = 10,
    offset: int = 0,
    order: str = "created_at",
    ascending: bool = False,
    closed: Optional[bool] = None,
    resolved: Optional[bool] = None,
    volume_min: Optional[Union[Decimal, float, int]] = None,
    volume_max: Optional[Union[Decimal, float, int]] = None,
    start_date_min: Optional[datetime] = None,
    start_date_max: Optional[datetime] = None,
    end_date_min: Optional[datetime] = None,
    end_date_max: Optional[datetime] = None,
) -> List[dict[str, Any]]:
    stmt = select(Market).options(selectinload(Market.category))
    conditions: list[Any] = []

    if closed is None and resolved is None:
        conditions.append(Market.is_closed == False)
        conditions.append(Market.is_resolved == False)
        conditions.append(Market.is_active == True)
    if closed is not None:
        conditions.append(Market.is_closed == closed)
    if resolved is not None:
        conditions.append(Market.is_resolved == resolved)
    if volume_min is not None:
        conditions.append(Market.volume >= volume_min)
    if volume_max is not None:
        conditions.append(Market.volume <= volume_max)
    if start_date_min is not None:
        conditions.append(Market.start_date >= start_date_min)
    if start_date_max is not None:
        conditions.append(Market.start_date <= start_date_max)
    if end_date_min is not None:
        conditions.append(Market.end_date >= end_date_min)
    if end_date_max is not None:
        conditions.append(Market.end_date <= end_date_max)

    if conditions:
        stmt = stmt.where(*conditions)

    sort_col = _ORDER_COLUMNS.get(order, Market.created_at)
    stmt = stmt.order_by(sort_col.asc() if ascending else sort_col.desc())
    stmt = stmt.offset(offset)
    if limit is not None:
        stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [market_to_dict(m) for m in rows]


async def get_market_by_id(session: AsyncSession, market_id: int) -> Optional[dict[str, Any]]:
    stmt = (
        select(Market)
        .options(selectinload(Market.category))
        .where(Market.id == market_id)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return market_to_dict(row) if row else None


async def get_market_by_slug(session: AsyncSession, slug: str) -> Optional[dict[str, Any]]:
    stmt = (
        select(Market)
        .options(selectinload(Market.category))
        .where(Market.slug == slug)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return market_to_dict(row) if row else None


async def market_prices_history(
    session: AsyncSession,
    market_id: int,
    *,
    start_ts: Optional[datetime] = None,
    end_ts: Optional[datetime] = None,
    interval: Optional[str] = None,
) -> List[dict[str, Any]]:
    market_stmt = select(Market.token_yes_id).where(Market.id == market_id)
    market_result = await session.execute(market_stmt)
    token_yes_id = market_result.scalar_one_or_none()
    if not token_yes_id:
        return []

    conditions: list[Any] = [MarketPriceCandle.token_id == token_yes_id]
    if start_ts is not None:
        conditions.append(MarketPriceCandle.ts >= start_ts)
    if end_ts is not None:
        conditions.append(MarketPriceCandle.ts <= end_ts)
    if interval is not None:
        conditions.append(MarketPriceCandle.interval == interval)

    candles_stmt = (
        select(MarketPriceCandle.ts, MarketPriceCandle.close_price)
        .where(*conditions)
        .order_by(MarketPriceCandle.ts.asc())
    )
    candles_result = await session.execute(candles_stmt)
    rows = candles_result.all()
    return [{"date": ts, "probability": close_price} for ts, close_price in rows]


async def market_holders(
    session: AsyncSession,
    *,
    market_id: int,
    limit: int = 20,
    min_balance: int = 1,
) -> List[dict[str, Any]]:
    ranked_holders = (
        select(
            MarketHolder.token_id.label("token_id"),
            MarketHolder.user_id.label("user_id"),
            MarketHolder.amount.label("amount"),
            func.row_number()
            .over(
                partition_by=MarketHolder.token_id,
                order_by=MarketHolder.amount.desc(),
            )
            .label("rn"),
        )
        .where(
            MarketHolder.market_id == market_id,
            MarketHolder.amount >= min_balance,
        )
        .subquery("ranked_holders")
    )

    stmt = (
        select(
            ranked_holders.c.token_id,
            ranked_holders.c.user_id,
            ranked_holders.c.amount,
        )
        .where(ranked_holders.c.rn <= limit)
        .order_by(ranked_holders.c.token_id.asc(), ranked_holders.c.amount.desc())
    )

    result = await session.execute(
        stmt
    )
    rows = result.mappings().all()

    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        token = row["token_id"]
        grouped.setdefault(token, []).append(
            {
                "user_id": row["user_id"],
                "amount": row["amount"],
            }
        )

    return [{"token": token, "holders": holders} for token, holders in grouped.items()]

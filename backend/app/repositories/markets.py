from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional, Union

from sqlalchemy import func, inspect as sa_inspect, or_, select, text, union_all
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_price_candles import MarketPriceCandle
from app.core.config import Config

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


async def get_market_price(
    session: AsyncSession, *, token_id: str, side: str
) -> Optional[dict[str, Any]]:
    stmt = select(Market).where(
        or_(Market.token_yes_id == token_id, Market.token_no_id == token_id)
    )
    result = await session.execute(stmt)
    market = result.scalar_one_or_none()
    if not market:
        return None

    is_yes_token = market.token_yes_id == token_id
    token_side = "YES" if is_yes_token else "NO"
    base_price = market.outcome_price_yes if is_yes_token else market.outcome_price_no
    if base_price is None:
        base_price = Decimal("0")

    if side == "BUY":
        price = base_price * (1 + Decimal(Config.SPREAD))
    else:
        price = base_price * (1 - Decimal(Config.SPREAD))

    return {
        "market_id": market.id,
        "token_id": token_id,
        "token_side": token_side,
        "side": side,
        "price": price,
    }


async def get_market_prices(
    session: AsyncSession, *, token_ids: list[str], sides: list[str]
) -> Optional[dict[str, dict[str, Decimal]]]:
    stmt = select(Market).where(
        or_(Market.token_yes_id.in_(token_ids), Market.token_no_id.in_(token_ids))
    )
    result = await session.execute(stmt)
    markets = result.scalars().all()

    if not markets:
        return None

    token_to_market: dict[str, Market] = {}
    for market in markets:
        if market.token_yes_id:
            token_to_market[market.token_yes_id] = market
        if market.token_no_id:
            token_to_market[market.token_no_id] = market

    price_map: dict[str, dict[str, Decimal]] = {}
    for token_id, side in zip(token_ids, sides):
        market = token_to_market.get(token_id)
        if not market:
            return None

        is_yes_token = market.token_yes_id == token_id
        base_price = market.outcome_price_yes if is_yes_token else market.outcome_price_no
        if base_price is None:
            base_price = Decimal("0")

        if side == "BUY":
            price = base_price * (1 + Decimal(Config.SPREAD))
        else:
            price = base_price * (1 - Decimal(Config.SPREAD))

        price_map[token_id] = {side: price}

    return price_map


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
    stmt_yes = (
        select(
            MarketPosition.yes_token_id.label("token_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.yes_shares.label("shares"),
            MarketPosition.avg_price_yes.label("avg_price"),
        )
        .where(
            MarketPosition.market_id == market_id,
            MarketPosition.yes_shares >= min_balance,
        )
        .order_by(MarketPosition.yes_shares.desc())
        .limit(limit)
    )

    stmt_no = (
        select(
            MarketPosition.no_token_id.label("token_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.no_shares.label("shares"),
            MarketPosition.avg_price_no.label("avg_price"),
        )
        .where(
            MarketPosition.market_id == market_id,
            MarketPosition.no_shares >= min_balance,
        )
        .order_by(MarketPosition.no_shares.desc())
        .limit(limit)
    )

    result = await session.execute(union_all(stmt_yes, stmt_no))
    rows = result.mappings().all()

    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        token = row["token_id"]
        grouped.setdefault(token, []).append(
            {
                "user_id": row["user_id"],
                "shares": row["shares"],
                "avg_price": row["avg_price"],
            }
        )

    return [{"token_id": token_id, "holders": holders} for token_id, holders in grouped.items()]


async def list_positions(
    session: AsyncSession,
    *,
    market_id: int,
    status: Optional[str] = "ALL",
    limit: int = 20,
    offset: int = 0,
    sort_by: Optional[str] = "shares",
    sort_direction: Optional[str] = "DESC",
) -> List[dict[str, Any]]:
    if sort_by not in ["shares"]:
        raise ValueError("Invalid sort_by")
    if sort_direction not in ["ASC", "DESC"]:
        raise ValueError("Invalid sort_direction")
    if status not in ["ALL", "OPEN", "CLOSED"]:
        raise ValueError("Invalid status")

    base_conditions: list[Any] = [
        MarketPosition.market_id == market_id,
        Market.is_active == True,
    ]
    if status == "OPEN":
        base_conditions.append(Market.is_closed == False)
    elif status == "CLOSED":
        base_conditions.append(Market.is_closed == True)

    yes_stmt = (
        select(
            MarketPosition.id.label("id"),
            MarketPosition.market_id.label("market_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.yes_token_id.label("token_id"),
            Market.question.label("question"),
            MarketPosition.yes_shares.label("shares"),
            MarketPosition.yes_pi_amount.label("pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .where(*base_conditions, MarketPosition.yes_shares > 0)
        .order_by(MarketPosition.yes_shares.asc() if sort_direction == "asc" else MarketPosition.yes_shares.desc())
        .limit(limit)
        .offset(offset)
    )

    no_stmt = (
        select(
            MarketPosition.id.label("id"),
            MarketPosition.market_id.label("market_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.no_token_id.label("token_id"),
            Market.question.label("question"),
            MarketPosition.no_shares.label("shares"),
            MarketPosition.no_pi_amount.label("pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .where(*base_conditions, MarketPosition.no_shares > 0)
        .order_by(MarketPosition.no_shares.asc() if sort_direction == "asc" else MarketPosition.no_shares.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await session.execute(union_all(yes_stmt, no_stmt))
    rows = result.mappings().all()

    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        token = row["token_id"]
        grouped.setdefault(token, []).append(row)

    return [{"token_id": token_id, "positions": positions} for token_id, positions in grouped.items()]

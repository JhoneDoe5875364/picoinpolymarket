from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, List, Literal, Optional, Union

from sqlalchemy import func, insert, inspect as sa_inspect, or_, select, text, union_all, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Config
from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_trades import MarketTrade
from app.models.tables.market_price_candles import MarketPriceCandle

_ORDER_COLUMNS: dict[str, Any] = {
    "created_at": Market.created_at,
    "updated_at": Market.updated_at,
    "start_date": Market.start_date,
    "end_date": Market.end_date,
    "volume": Market.volume,
}

_TRADE_ORDER_COLUMNS: dict[str, Any] = {
    "id": MarketTrade.id,
    "created_at": MarketTrade.created_at,
    "price": MarketTrade.price,
    "shares": MarketTrade.shares,
    "pi_amount": MarketTrade.pi_amount,
    "pi_total_amount": MarketTrade.pi_total_amount,
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
    category: str = "all",
    closed: Optional[bool] = None,
    resolved: Optional[bool] = None,
    volume_min: Optional[Union[Decimal, float, int]] = None,
    volume_max: Optional[Union[Decimal, float, int]] = None,
    start_date_min: Optional[datetime] = None,
    start_date_max: Optional[datetime] = None,
    end_date_min: Optional[datetime] = None,
    end_date_max: Optional[datetime] = None,
) -> List[dict[str, Any]]:
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
    if category and category.strip().lower() != "all":
        normalized_category = category.strip().lower()
        conditions.append(Market.category.has(func.lower(Category.slug) == normalized_category))

    sort_col = _ORDER_COLUMNS.get(order, Market.created_at)
    stmt = (
        select(Market)
        .options(selectinload(Market.category))
        .where(*conditions)
        .order_by(sort_col.asc() if ascending else sort_col.desc())
        .offset(offset)
        .limit(limit)
    )

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


async def get_market_token_id(session: AsyncSession, market_id: int, outcome: Literal["YES", "NO"]) -> Optional[str]:
    stmt = select(Market.token_yes_id if outcome == "YES" else Market.token_no_id).where(Market.id == market_id)
    result = await session.execute(stmt)
    token_id = result.scalar_one_or_none()
    if not token_id:
        raise ValueError("Market not found")
    return token_id


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
    interval_seconds_map: dict[str, int] = {
        "1H": 60 * 60,
        "1D": 24 * 60 * 60,
        "1W": 7 * 24 * 60 * 60,
        "1M": 30 * 24 * 60 * 60,
        "1Y": 365 * 24 * 60 * 60,
        "MAX": 0,
    }
    target_points = 60

    market_stmt = select(Market.token_yes_id).where(Market.id == market_id)
    market_result = await session.execute(market_stmt)
    token_yes_id = market_result.scalar_one_or_none()
    if not token_yes_id:
        return []

    has_interval_from_ts = False
    if interval is not None:
        end_ts = int(datetime.now().timestamp())
        if interval != "MAX":
            start_ts = end_ts - interval_seconds_map[interval]
            has_interval_from_ts = True

    sampled_stmt = text(
        """
        WITH bounds AS (
            SELECT
                MIN(ts) AS min_ts,
                MAX(ts) AS max_ts
            FROM market_price_candles
            WHERE market_id = :market_id
                AND token_id = :token_id
                AND (:has_from_ts = FALSE OR ts >= :from_ts)
                AND ts <= :to_ts
        ),
        targets AS (
            SELECT
                gs.idx,
                CASE
                    WHEN b.min_ts IS NULL OR b.max_ts IS NULL THEN NULL
                    WHEN b.max_ts = b.min_ts THEN b.min_ts
                    ELSE (b.min_ts + ((b.max_ts - b.min_ts) * gs.idx / :denominator))::bigint
                END AS target_ts
            FROM bounds b
            CROSS JOIN generate_series(0, :denominator) AS gs(idx)
        )
        SELECT sampled.ts, sampled.close_price
        FROM targets t
        JOIN LATERAL (
            SELECT c.ts, c.close_price
            FROM market_price_candles c
            WHERE c.market_id = :market_id
                AND c.token_id = :token_id
                AND c.ts >= t.target_ts
                AND c.ts <= :to_ts
            ORDER BY c.ts ASC
            LIMIT 1
        ) AS sampled ON t.target_ts IS NOT NULL
        ORDER BY sampled.ts ASC
        """
    )
    sampled_result = await session.execute(
        sampled_stmt,
        {
            "market_id": market_id,
            "token_id": token_yes_id,
            "has_from_ts": has_interval_from_ts,
            "from_ts": start_ts,
            "to_ts": end_ts,
            "denominator": target_points - 1,
        },
    )
    sampled_rows = sampled_result.all()
    return [
        {"timestamp": ts, "probability": close_price}
        for ts, close_price in sampled_rows
    ]


async def market_holders(
    session: AsyncSession,
    *,
    market_id: int,
    limit: int = 20,
    min_balance: int = 1,
) -> List[dict[str, Any]]:
    stmt_yes = (
        select(
            MarketPosition.token_id.label("token_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.shares.label("shares"),
            MarketPosition.avg_price.label("avg_price"),
        )
        .where(
            MarketPosition.market_id == market_id,
            MarketPosition.outcome == "YES",
            MarketPosition.shares >= min_balance,
        )
        .order_by(MarketPosition.shares.desc())
        .limit(limit)
    )

    stmt_no = (
        select(
            MarketPosition.token_id.label("token_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.shares.label("shares"),
            MarketPosition.avg_price.label("avg_price"),
        )
        .where(
            MarketPosition.market_id == market_id,
            MarketPosition.outcome == "NO",
            MarketPosition.shares >= min_balance,
        )
        .order_by(MarketPosition.shares.desc())
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
    order: Optional[str] = "shares",
    ascending: bool = False,
) -> List[dict[str, Any]]:
    if order not in ["pnl", "shares", "username", "avg_price", "pi_amount", "created_at"]:
        raise ValueError("Invalid order")
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
            MarketPosition.token_id.label("token_id"),
            MarketPosition.side.label("side"),
            MarketPosition.outcome.label("outcome"),
            Market.question.label("question"),
            MarketPosition.shares.label("shares"),
            MarketPosition.pi_amount.label("pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .where(*base_conditions, MarketPosition.outcome == "YES")
        .order_by(MarketPosition.shares.asc() if ascending else MarketPosition.shares.desc())
        .limit(limit)
        .offset(offset)
    )

    no_stmt = (
        select(
            MarketPosition.id.label("id"),
            MarketPosition.market_id.label("market_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.token_id.label("token_id"),
            MarketPosition.side.label("side"),
            MarketPosition.outcome.label("outcome"),
            Market.question.label("question"),
            MarketPosition.shares.label("shares"),
            MarketPosition.pi_amount.label("pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .where(*base_conditions, MarketPosition.outcome == "NO")
        .order_by(MarketPosition.shares.asc() if ascending else MarketPosition.shares.desc())
        .limit(limit)
        .offset(offset)
    )

    yes_result = await session.execute(yes_stmt)
    no_result = await session.execute(no_stmt)
    yes_rows = yes_result.mappings().all()
    no_rows = no_result.mappings().all()

    return {
        "YES": yes_rows,
        "NO": no_rows,
    }


async def list_market_trades(
    session: AsyncSession,
    *,
    market_id: int,
    limit: int = 20,
    offset: int = 0,
    order: str = "created_at",
    ascending: bool = False,
) -> List[dict[str, Any]]:
    sort_col = _TRADE_ORDER_COLUMNS.get(order, MarketTrade.created_at)
    stmt = (
        select(MarketTrade)
        .where(MarketTrade.market_id == market_id)
        .order_by(sort_col.asc() if ascending else sort_col.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await session.execute(stmt)
    rows = result.scalars().all()

    return [
        {
            "id": row.id,
            "created_at": row.created_at,
            "token_id": row.token_id,
            "market_id": row.market_id,
            "taker_user_id": row.taker_user_id,
            "maker_user_id": row.maker_user_id,
            "side": row.side,
            "outcome": row.outcome,
            "price": row.price,
            "shares": row.shares,
            "pi_amount": row.pi_amount,
            "pi_fee": row.pi_fee,
            "pi_total_amount": row.pi_total_amount,
        }
        for row in rows
    ]


async def insert_trade(
    session: AsyncSession,
    *,
    market_id: int,
    token_id: str,
    user_id: int,
    side: Literal["BUY", "SELL"],
    outcome: Literal["YES", "NO"],
    price: float,
    shares: float,
) -> int:
    pi_amount = price * shares
    pi_fee = pi_amount * Decimal(Config.FEE)
    pi_total_amount = pi_amount + pi_fee
    stmt = insert(MarketTrade).values(
        market_id=market_id,
        token_id=token_id,
        taker_user_id=user_id,
        side=side,
        outcome=outcome,
        price=Decimal(price),
        shares=Decimal(shares),
        pi_amount=Decimal(pi_amount),
        pi_fee=Decimal(pi_fee),
        pi_total_amount=Decimal(pi_total_amount),
        created_at=datetime.now(),
    )
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()


async def get_position(
    session: AsyncSession,
    *,
    market_id: int,
    user_id: int,
    outcome: Literal["YES", "NO"],
) -> Optional[dict[str, Any]]:
    stmt = select(MarketPosition).where(
        MarketPosition.market_id == market_id,
        MarketPosition.user_id == user_id,
        MarketPosition.outcome == outcome,
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return dict(row) if row else None


async def update_position(
    session: AsyncSession,
    *,
    market_id: int,
    user_id: int,
    outcome: Literal["YES", "NO"],
    price: float,
    shares: float,
) -> dict[str, Any]:
    market = await get_market_by_id(session, market_id=market_id)
    if not market:
        raise ValueError("Market not found")
    
    token_yes_id = market["token_yes_id"]
    token_no_id = market["token_no_id"]
    pi_amount = price * shares

    position = await get_position(session, market_id=market_id, user_id=user_id)
    if not position:
        yes_shares = shares if outcome == "YES" else 0
        no_shares = shares if outcome == "NO" else 0
        yes_pi_amount = pi_amount if outcome == "YES" else 0
        no_pi_amount = pi_amount if outcome == "NO" else 0
        yes_avg_price = pi_amount / shares if outcome == "YES" else 0
        no_avg_price = pi_amount / shares if outcome == "NO" else 0
        return await insert_position(
            session, 
            market_id=market_id, 
            user_id=user_id, 
            yes_token_id=token_yes_id, 
            no_token_id=token_no_id, 
            yes_shares=Decimal(yes_shares), 
            no_shares=Decimal(no_shares), 
            yes_pi_amount=Decimal(yes_pi_amount), 
            no_pi_amount=Decimal(no_pi_amount), 
            yes_avg_price=Decimal(yes_avg_price), 
            no_avg_price=Decimal(no_avg_price),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
    
    yes_shares = position["yes_shares"] + shares if outcome == "YES" else position["yes_shares"]
    no_shares = position["no_shares"] + shares if outcome == "NO" else position["no_shares"]
    yes_pi_amount = position["yes_pi_amount"] + pi_amount if outcome == "YES" else position["yes_pi_amount"]
    no_pi_amount = position["no_pi_amount"] + pi_amount if outcome == "NO" else position["no_pi_amount"]
    yes_avg_price = yes_pi_amount / yes_shares if outcome == "YES" else position["yes_avg_price"]
    no_avg_price = yes_pi_amount / no_shares if outcome == "NO" else position["no_avg_price"]

    stmt = update(MarketPosition).where(
        MarketPosition.market_id == market_id,
        MarketPosition.user_id == user_id,
    ).values(
        yes_shares=Decimal(yes_shares),
        no_shares=Decimal(no_shares),
        yes_pi_amount=Decimal(yes_pi_amount),
        no_pi_amount=Decimal(no_pi_amount),
        avg_price_yes=Decimal(yes_avg_price),
        avg_price_no=Decimal(no_avg_price),
        updated_at=datetime.now(),
    )
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()


async def insert_position(
    session: AsyncSession,
    *,
    market_id: int,
    user_id: int,
    yes_token_id: str,
    no_token_id: str,
    yes_shares: float,
    no_shares: float,
    yes_pi_amount: float,
    no_pi_amount: float,
    yes_avg_price: float,
    no_avg_price: float,
) -> int:
    stmt = insert(MarketPosition).values(
        market_id=market_id,
        user_id=user_id,
        yes_token_id=yes_token_id,
        no_token_id=no_token_id,
        yes_shares=Decimal(yes_shares),
        no_shares=Decimal(no_shares),
        yes_pi_amount=Decimal(yes_pi_amount),
        no_pi_amount=Decimal(no_pi_amount),
        avg_price_yes=Decimal(yes_avg_price),
        avg_price_no=Decimal(no_avg_price),
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()
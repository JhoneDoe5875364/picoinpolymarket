from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, List, Literal, Optional, Union

from sqlalchemy import case, func, insert, inspect as sa_inspect, or_, select, text, union_all, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Config
from app.repositories import comments as comments_repo
from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.market_stats import MarketStat
from app.models.tables.market_token import MarketToken
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_trades import MarketTrade
from app.models.tables.user import User

_ORDER_COLUMNS: dict[str, Any] = {
    "id": Market.id,
    "question": Market.question,
    "status": Market.status,
    "category": Market.category,
    "start_date": Market.start_date,
    "end_date": Market.end_date,
    "volume": Market.volume,
    "created_at": Market.created_at,
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
    tokens_by_outcome = {token.outcome: token for token in getattr(m, "market_tokens", [])}
    yes_token = tokens_by_outcome.get("YES")
    no_token = tokens_by_outcome.get("NO")
    d["token_yes"] = yes_token.token if yes_token is not None else None
    d["token_no"] = no_token.token if no_token is not None else None
    d["outcome_price_yes"] = yes_token.price if yes_token is not None else None
    d["outcome_price_no"] = no_token.price if no_token is not None else None
    cr = m.category
    d["category"] = cr.slug if cr is not None else None
    return d


def _as_utc(dt: Any) -> datetime | None:
    if not isinstance(dt, datetime):
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _build_market_labels(
    row: dict[str, Any],
    *,
    now_utc: datetime,
    new_window_start: datetime,
    ending_soon_window_end: datetime,
) -> list[str]:
    labels: list[str] = []
    created_at = _as_utc(row.get("created_at"))
    end_date = _as_utc(row.get("end_date"))
    trending_score = float(row.get("trending_score") or 0)
    hot_score = float(row.get("hot_score") or 0)

    if created_at and created_at >= new_window_start:
        labels.append("New")
    if trending_score > 0:
        labels.append("Trending")
    if hot_score > 0:
        labels.append("Hot")
    if end_date and now_utc <= end_date <= ending_soon_window_end:
        labels.append("Ending Soon")

    return labels


async def list_markets(
    session: AsyncSession,
    *,
    limit: Optional[int] = 10,
    offset: int = 0,
    order: str = "created_at",
    ascending: bool = False,
    discovery: Literal["default", "trending", "new", "hot", "ending_soon", "most_discussed"] = "default",
    search: Optional[str] = None,
    category: str = "all",
    status: Optional[str] = None,
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
    now_utc = datetime.now(timezone.utc)
    new_window_start = now_utc - timedelta(hours=72)
    ending_soon_window_end = now_utc + timedelta(hours=72)

    if status is not None and status.strip().lower() != "all":
        conditions.append(Market.status == status)
    # if closed is None and resolved is None:
        # conditions.append(Market.is_closed == False)
        # conditions.append(Market.is_resolved == False)
        # conditions.append(Market.is_active == True)
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
    if search is not None and search.strip():
        search_text = f"%{search.strip()}%"
        conditions.append(
            or_(
                Market.question.ilike(search_text),
                Market.description.ilike(search_text),
                Market.slug.ilike(search_text),
            )
        )
    if category and category.strip().lower() != "all":
        normalized_category = category.strip().lower()
        conditions.append(Market.category.has(func.lower(Category.slug) == normalized_category))

    if discovery == "new":
        conditions.append(Market.created_at.is_not(None))
        conditions.append(Market.created_at >= new_window_start)
    elif discovery == "ending_soon":
        conditions.append(Market.end_date.is_not(None))
        conditions.append(Market.end_date >= now_utc)
        conditions.append(Market.end_date <= ending_soon_window_end)

    stmt = (
        select(Market, MarketStat)
        .options(selectinload(Market.category), selectinload(Market.market_tokens))
        .outerjoin(MarketStat, MarketStat.market_id == Market.id)
        .where(*conditions)
    )

    if discovery in ("trending", "hot", "most_discussed"):
        recent_activity = func.coalesce(MarketStat.activity_24h, 0)
        volume_score = func.coalesce(Market.volume, 0)

        if discovery == "trending":
            stmt = (
                stmt.where(recent_activity > 0)
                .order_by(
                    func.coalesce(MarketStat.trending_score, 0).desc(),
                    recent_activity.desc(),
                    Market.volume.desc(),
                )
            )
        elif discovery == "most_discussed":
            stmt = stmt.order_by(
                func.coalesce(MarketStat.comments_24h, 0).desc(),
                func.coalesce(MarketStat.activity_24h, 0).desc(),
                Market.volume.desc(),
            )
        else:
            stmt = (
                stmt.where((recent_activity > 0) | (volume_score > 0))
                .order_by(
                    func.coalesce(MarketStat.hot_score, 0).desc(),
                    recent_activity.desc(),
                    Market.volume.desc(),
                )
            )
    elif discovery == "new":
        stmt = stmt.order_by(Market.created_at.desc())
    elif discovery == "ending_soon":
        stmt = stmt.order_by(Market.end_date.asc())
    else:
        sort_col = _ORDER_COLUMNS.get(order, Market.created_at)
        stmt = stmt.order_by(sort_col.asc() if ascending else sort_col.desc())

    stmt = stmt.offset(offset).limit(limit)

    result = await session.execute(stmt)
    rows = result.all()
    payload: list[dict[str, Any]] = []
    featured_counter = 0
    for idx, pair in enumerate(rows):
        market, stats = pair
        item = market_to_dict(market)
        item["trades_24h"] = int(getattr(stats, "trades_24h", 0) or 0)
        item["comments_24h"] = int(getattr(stats, "comments_24h", 0) or 0)
        item["activity_24h"] = int(getattr(stats, "activity_24h", 0) or 0)
        item["price_move_24h"] = float(getattr(stats, "price_move_24h", 0) or 0)
        item["trending_score"] = float(getattr(stats, "trending_score", 0) or 0)
        item["hot_score"] = float(getattr(stats, "hot_score", 0) or 0)
        is_ending_soon = False
        if item.get("end_date"):
            try:
                is_ending_soon = bool(
                    item["end_date"] >= now_utc
                    and item["end_date"] <= ending_soon_window_end
                )
            except TypeError:
                is_ending_soon = False
        item["is_ending_soon"] = is_ending_soon
        item["labels"] = _build_market_labels(
            item,
            now_utc=now_utc,
            new_window_start=new_window_start,
            ending_soon_window_end=ending_soon_window_end,
        )
        if offset == 0 and idx < 5:
            featured_counter += 1
            item["featured_rank"] = featured_counter
        else:
            item["featured_rank"] = None
        payload.append(item)
    return payload


async def market_status_summary(
    session: AsyncSession,
    *,
    search: Optional[str] = None,
    category: str = "all",
    active_only: bool = True,
) -> dict[str, int]:
    conditions: list[Any] = []

    if active_only:
        conditions.append(Market.is_active == True)
    if search is not None and search.strip():
        search_text = f"%{search.strip()}%"
        conditions.append(
            or_(
                Market.question.ilike(search_text),
                Market.description.ilike(search_text),
                Market.slug.ilike(search_text),
            )
        )
    if category and category.strip().lower() != "all":
        normalized_category = category.strip().lower()
        conditions.append(Market.category.has(func.lower(Category.slug) == normalized_category))

    stmt = select(
        func.count(Market.id).label("total"),
        func.coalesce(func.sum(case((Market.status == "open", 1), else_=0)), 0).label("open_count"),
        func.coalesce(func.sum(case((Market.status == "pending", 1), else_=0)), 0).label("pending_count"),
        func.coalesce(func.sum(case((Market.status == "resolved", 1), else_=0)), 0).label("resolved_count"),
    ).where(*conditions)

    result = await session.execute(stmt)
    row = result.one()
    return {
        "total": int(row.total or 0),
        "open": int(row.open_count or 0),
        "pending": int(row.pending_count or 0),
        "resolved": int(row.resolved_count or 0),
    }


async def list_featured_markets(
    session: AsyncSession,
    *,
    limit: int = 5,
) -> List[dict[str, Any]]:
    now_utc = datetime.now(timezone.utc)
    new_window_start = now_utc - timedelta(hours=72)
    ending_soon_window_end = now_utc + timedelta(hours=72)

    stmt = (
        select(Market, MarketStat)
        .options(selectinload(Market.category), selectinload(Market.market_tokens))
        .outerjoin(MarketStat, MarketStat.market_id == Market.id)
        .where(
            Market.is_active == True,
            Market.is_closed == False,
            Market.is_resolved == False,
        )
        .order_by(
            func.coalesce(MarketStat.trending_score, 0).desc(),
            func.coalesce(MarketStat.hot_score, 0).desc(),
            func.coalesce(MarketStat.activity_24h, 0).desc(),
            Market.volume.desc(),
            Market.created_at.desc(),
        )
        .limit(limit)
    )

    result = await session.execute(stmt)
    rows = result.all()
    payload: list[dict[str, Any]] = []
    featured_comments_limit = 12
    for idx, pair in enumerate(rows):
        market, stats = pair
        item = market_to_dict(market)
        item["trades_24h"] = int(getattr(stats, "trades_24h", 0) or 0)
        item["comments_24h"] = int(getattr(stats, "comments_24h", 0) or 0)
        item["activity_24h"] = int(getattr(stats, "activity_24h", 0) or 0)
        item["price_move_24h"] = float(getattr(stats, "price_move_24h", 0) or 0)
        item["trending_score"] = float(getattr(stats, "trending_score", 0) or 0)
        item["hot_score"] = float(getattr(stats, "hot_score", 0) or 0)
        is_ending_soon = False
        if item.get("end_date"):
            try:
                is_ending_soon = bool(
                    item["end_date"] >= now_utc
                    and item["end_date"] <= ending_soon_window_end
                )
            except TypeError:
                is_ending_soon = False
        item["is_ending_soon"] = is_ending_soon
        item["labels"] = _build_market_labels(
            item,
            now_utc=now_utc,
            new_window_start=new_window_start,
            ending_soon_window_end=ending_soon_window_end,
        )
        price_history = await market_prices_history(
            session,
            market.id,
            interval="1D",
        )
        item["price_history"] = price_history
        item["sparkline"] = [
            float(point.get("probability", 0))
            for point in price_history
            if point.get("probability") is not None
        ]
        comments_rows = await comments_repo.list_market_comments(
            session,
            market_id=market.id,
            offset=0,
            limit=featured_comments_limit,
            include_deleted=False,
        )
        item["featured_comments"] = comments_rows.get("items", [])
        item["featured_rank"] = idx + 1
        payload.append(item)
    return payload


async def get_market_by_id(session: AsyncSession, market_id: int) -> Optional[dict[str, Any]]:
    stmt = (
        select(Market)
        .options(selectinload(Market.category), selectinload(Market.market_tokens))
        .where(Market.id == market_id)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return market_to_dict(row) if row else None


async def get_market_by_slug(session: AsyncSession, slug: str) -> Optional[dict[str, Any]]:
    stmt = (
        select(Market)
        .options(selectinload(Market.category), selectinload(Market.market_tokens))
        .where(Market.slug == slug)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return market_to_dict(row) if row else None


async def get_market_token(session: AsyncSession, market_id: int, outcome: Literal["YES", "NO"]) -> Optional[str]:
    stmt = select(MarketToken.token).where(
        MarketToken.market_id == market_id,
        MarketToken.outcome == outcome,
    )
    result = await session.execute(stmt)
    token = result.scalar_one_or_none()
    if not token:
        raise ValueError("Market token not found")
    return token


async def get_market_price(
    session: AsyncSession, *, token: str, side: str
) -> Optional[dict[str, Any]]:
    stmt = select(MarketToken.market_id, MarketToken.outcome, MarketToken.price).where(
        MarketToken.token == token
    )
    result = await session.execute(stmt)
    token_row = result.one_or_none()
    if token_row is None:
        return None

    market_id, token_side, base_price = token_row
    if base_price is None:
        base_price = Decimal("0")

    if side == "BUY":
        price = base_price * (1 + Decimal(Config.SPREAD))
    else:
        price = base_price * (1 - Decimal(Config.SPREAD))

    return {
        "market_id": market_id,
        "token": token,
        "token_side": token_side,
        "side": side,
        "price": price,
    }


async def get_market_prices(
    session: AsyncSession, *, tokens: list[str], sides: list[str]
) -> Optional[dict[str, dict[str, Decimal]]]:
    stmt = select(MarketToken.token, MarketToken.price).where(MarketToken.token.in_(tokens))
    result = await session.execute(stmt)
    token_price_rows = result.all()
    if not token_price_rows:
        return None

    token_to_price: dict[str, Decimal] = {
        token: price if price is not None else Decimal("0")
        for token, price in token_price_rows
    }

    price_map: dict[str, dict[str, Decimal]] = {}
    for token, side in zip(tokens, sides):
        base_price = token_to_price.get(token)
        if base_price is None:
            return None

        if side == "BUY":
            price = base_price * (1 + Decimal(Config.SPREAD))
        else:
            price = base_price * (1 - Decimal(Config.SPREAD))

        price_map[token] = {side: price}

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

    market_stmt = select(MarketToken.token).where(
        MarketToken.market_id == market_id,
        MarketToken.outcome == "YES",
    )
    market_result = await session.execute(market_stmt)
    token_yes = market_result.scalar_one_or_none()
    if not token_yes:
        return []

    has_interval_from_ts = False
    if interval is not None:
        end_ts = int(datetime.now(timezone.utc).timestamp())
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
                AND token = :token
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
                AND c.token = :token
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
            "token": token_yes,
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
    offset: int = 0,
    min_balance: int = 1,
) -> List[dict[str, Any]]:
    stmt_yes = (
        select(
            MarketPosition.token.label("token"),
            MarketPosition.outcome.label("outcome"),
            MarketPosition.user_id.label("user_id"),
            User.pi_username.label("pi_username"),
            MarketPosition.shares.label("shares"),
            MarketPosition.avg_price.label("avg_price"),
        )
        .where(
            MarketPosition.market_id == market_id,
            MarketPosition.outcome == "YES",
            MarketPosition.shares >= min_balance,
        )
        .join(User, User.id == MarketPosition.user_id)
        .order_by(MarketPosition.shares.desc())
        .limit(limit)
        .offset(offset)
    )

    stmt_no = (
        select(
            MarketPosition.token.label("token"),
            MarketPosition.outcome.label("outcome"),
            MarketPosition.user_id.label("user_id"),
            User.pi_username.label("pi_username"),
            MarketPosition.shares.label("shares"),
            MarketPosition.avg_price.label("avg_price"),
        )
        .where(
            MarketPosition.market_id == market_id,
            MarketPosition.outcome == "NO",
            MarketPosition.shares >= min_balance,
        )
        .join(User, User.id == MarketPosition.user_id)
        .order_by(MarketPosition.shares.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await session.execute(union_all(stmt_yes, stmt_no))
    rows = result.mappings().all()

    grouped: dict[str, dict[str, list[dict[str, Any]]]] = {}
    for row in rows:
        token = row["token"]
        outcome = row["outcome"]
        grouped.setdefault(token, {}).setdefault(outcome, []).append(
            {
                "user_id": row["user_id"],
                "pi_username": row["pi_username"],
                "shares": row["shares"],
                "avg_price": row["avg_price"],
            }
        )

    return [
        {"token": token, "outcome": outcome, "holders": holders}
        for token, outcomes in grouped.items()
        for outcome, holders in outcomes.items()
    ]


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
            User.pi_username.label("pi_username"),
            MarketPosition.token.label("token"),
            MarketPosition.side.label("side"),
            MarketPosition.outcome.label("outcome"),
            Market.question.label("question"),
            MarketPosition.shares.label("shares"),
            MarketPosition.pi_amount.label("pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .join(User, User.id == MarketPosition.user_id)
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
            User.pi_username.label("pi_username"),
            MarketPosition.token.label("token"),
            MarketPosition.side.label("side"),
            MarketPosition.outcome.label("outcome"),
            Market.question.label("question"),
            MarketPosition.shares.label("shares"),
            MarketPosition.pi_amount.label("pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .join(User, User.id == MarketPosition.user_id)
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
    min_amount: Optional[Union[Decimal, float]] = None,
    limit: int = 20,
    offset: int = 0,
    order: str = "created_at",
    ascending: bool = False,
) -> List[dict[str, Any]]:
    sort_col = _TRADE_ORDER_COLUMNS.get(order, MarketTrade.created_at)
    conditions: list[Any] = [MarketTrade.market_id == market_id]
    if min_amount is not None:
        conditions.append(MarketTrade.pi_amount >= min_amount)

    stmt = (
        select(
            MarketTrade.id.label("id"),
            MarketTrade.created_at.label("created_at"),
            MarketTrade.token.label("token"),
            MarketTrade.market_id.label("market_id"),
            MarketTrade.taker_user_id.label("taker_user_id"),
            User.pi_username.label("taker_pi_username"),
            MarketTrade.maker_user_id.label("maker_user_id"),
            MarketTrade.side.label("side"),
            MarketTrade.outcome.label("outcome"),
            MarketTrade.price.label("price"),
            MarketTrade.shares.label("shares"),
            MarketTrade.pi_amount.label("pi_amount"),
            MarketTrade.pi_fee.label("pi_fee"),
            MarketTrade.pi_total_amount.label("pi_total_amount"),
        )
        .where(*conditions)
        .join(User, User.id == MarketTrade.taker_user_id)
        .order_by(sort_col.asc() if ascending else sort_col.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await session.execute(stmt)
    rows = result.mappings().all()

    return [
        {
            "id": row["id"],
            "created_at": row["created_at"],
            "token": row["token"],
            "market_id": row["market_id"],
            "taker_user_id": row["taker_user_id"],
            "taker_pi_username": row["taker_pi_username"],
            "maker_user_id": row["maker_user_id"],
            "side": row["side"],
            "outcome": row["outcome"],
            "price": row["price"],
            "shares": row["shares"],
            "pi_amount": row["pi_amount"],
            "pi_fee": row["pi_fee"],
            "pi_total_amount": row["pi_total_amount"],
        }
        for row in rows
    ]


async def insert_trade(
    session: AsyncSession,
    *,
    market_id: int,
    token: str,
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
        token=token,
        taker_user_id=user_id,
        side=side,
        outcome=outcome,
        price=Decimal(price),
        shares=Decimal(shares),
        pi_amount=Decimal(pi_amount),
        pi_fee=Decimal(pi_fee),
        pi_total_amount=Decimal(pi_total_amount),
        created_at=datetime.now(timezone.utc),
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

    token_yes = await get_market_token(session, market_id=market_id, outcome="YES")
    token_no = await get_market_token(session, market_id=market_id, outcome="NO")
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
            yes_token=token_yes, 
            no_token=token_no, 
            yes_shares=Decimal(yes_shares), 
            no_shares=Decimal(no_shares), 
            yes_pi_amount=Decimal(yes_pi_amount), 
            no_pi_amount=Decimal(no_pi_amount), 
            yes_avg_price=Decimal(yes_avg_price), 
            no_avg_price=Decimal(no_avg_price),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
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
        updated_at=datetime.now(timezone.utc),
    )
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()


async def insert_position(
    session: AsyncSession,
    *,
    market_id: int,
    user_id: int,
    yes_token: str,
    no_token: str,
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
        yes_token=yes_token,
        no_token=no_token,
        yes_shares=Decimal(yes_shares),
        no_shares=Decimal(no_shares),
        yes_pi_amount=Decimal(yes_pi_amount),
        no_pi_amount=Decimal(no_pi_amount),
        avg_price_yes=Decimal(yes_avg_price),
        avg_price_no=Decimal(no_avg_price),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    result = await session.execute(stmt)
    await session.commit()
    return result.scalar_one_or_none()


async def list_categories(session: AsyncSession) -> List[dict[str, Any]]:
    rows = await session.execute(
        select(Category.id, Category.slug, Category.name).order_by(Category.slug.asc())
    )
    return [
        {"id": row.id, "slug": row.slug, "name": row.name or row.slug}
        for row in rows.all()
    ]
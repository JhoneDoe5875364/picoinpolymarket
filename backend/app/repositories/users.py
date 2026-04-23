from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import Float, String, and_, case, cast, func, select, union_all, update
from typing import Any, List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.tables.market import Market
from app.models.tables.market_token import MarketToken
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_trades import MarketTrade
from app.models.tables.user import User


def _safe_decimal(value: Decimal | None) -> Decimal:
    return value if value is not None else Decimal("0")


def _period_start(period: str) -> Optional[datetime]:
    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "1D":
        return day_start
    if period == "1W":
        return day_start - timedelta(days=day_start.weekday())
    if period == "1M":
        return day_start.replace(day=1)
    if period == "ALL":
        return None
    raise ValueError("Invalid period")


def _start_of_day(value: datetime) -> datetime:
    return value.astimezone(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(value: datetime) -> datetime:
    return _start_of_day(value).replace(day=1)


def _add_month(value: datetime) -> datetime:
    year = value.year
    month = value.month + 1
    if month > 12:
        year += 1
        month = 1
    return value.replace(year=year, month=month, day=1)


def _build_history_points(period: str, now: datetime, all_start: Optional[datetime] = None) -> list[datetime]:
    points: list[datetime] = []
    if period == "1D":
        cursor = _start_of_day(now)
        while cursor <= now:
            points.append(cursor)
            cursor += timedelta(hours=1)
    elif period in ["1W", "1M"]:
        cursor = _period_start(period)
        if cursor is None:
            return points
        while cursor <= now:
            points.append(cursor)
            cursor += timedelta(days=1)
    elif period == "ALL":
        if all_start is None:
            return points
        cursor = _start_of_month(all_start)
        end = _start_of_month(now)
        while cursor <= end:
            points.append(cursor)
            cursor = _add_month(cursor)
    else:
        raise ValueError("Invalid period")

    if not points or points[-1] < now:
        points.append(now)
    return points


async def get_users(
    session: AsyncSession,
    *,
    status: Optional[str] = "ALL",
    limit: int,
    offset: int,
    sort_by: str,
    order: str,
    search: str,
) -> Tuple[List[dict[str, Any]], int]:
    sort_columns: dict[str, Any] = {
        "created_at": User.created_at,
        "pi_username": User.pi_username,
        "balance": User.balance,
    }
    sort_col = sort_columns.get(sort_by, User.created_at)
    order_expr = sort_col.asc() if order == "ASC" else sort_col.desc()

    filters: list[Any] = []
    filters.append(User.role_id == 3)
    if status != "ALL":
        filters.append(User.status == status)
    if search and search.strip():
        filters.append(User.pi_username.ilike(f"%{search}%"))

    users_stmt = (
        select(
            User.id,
            User.pi_username,
            User.status,
            User.balance,
            User.created_at,
        )
        .where(*filters)
        .order_by(order_expr)
        .limit(limit)
        .offset(offset)
    )
    users_result = await session.execute(users_stmt)
    rows = [dict(x) for x in users_result.mappings().all()]

    count_stmt = select(func.count()).select_from(User).where(*filters)
    total = await session.scalar(count_stmt)
    return rows, int(total or 0)


async def get_users_summary(
    session: AsyncSession,
    *,
    search: str = "",
) -> dict[str, int]:
    filters: list[Any] = [User.role_id == 3]
    if search and search.strip():
        filters.append(User.pi_username.ilike(f"%{search}%"))

    stmt = select(
        func.count(User.id).label("total"),
        func.coalesce(
            func.sum(case((User.status == "ACTIVE", 1), else_=0)),
            0,
        ).label("active"),
        func.coalesce(
            func.sum(case((User.status == "SUSPENDED", 1), else_=0)),
            0,
        ).label("suspended"),
        func.coalesce(
            func.sum(case((User.status == "BANNED", 1), else_=0)),
            0,
        ).label("banned"),
    ).where(*filters)

    result = await session.execute(stmt)
    row = result.mappings().first()
    if not row:
        return {"total": 0, "active": 0, "suspended": 0, "banned": 0}
    return {
        "total": int(row["total"] or 0),
        "active": int(row["active"] or 0),
        "suspended": int(row["suspended"] or 0),
        "banned": int(row["banned"] or 0),
    }


async def get_user_balance_by_uuid(session: AsyncSession, pi_uid: str) -> Any:
    stmt = select(User).where(User.pi_uid == pi_uid)
    result = await session.execute(stmt)
    user_row = result.scalar_one_or_none()
    if not user_row:
        raise LookupError("User not found")
    return user_row.balance


async def update_user_status(
    session: AsyncSession, *, user_id: int, status: str
) -> dict[str, Any]:
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(status=status, updated_at=func.now())
        .returning(
            User.id,
            User.pi_uid,
            User.pi_username,
            User.status,
            User.balance,
            User.updated_at,
        )
    )
    result = await session.execute(stmt)
    user_row = result.mappings().first()
    if not user_row:
        raise LookupError("User not found")
    await session.commit()
    return dict(user_row)


async def list_positions(
    session: AsyncSession,
    *,
    user_id: int,
    is_closed: Optional[bool] = None,
    search: str = "",
    limit: int = 20,
    offset: int = 0,
    order: Optional[str] = "shares",
    ascending: bool = False,
) -> List[dict[str, Any]]:
    order_columns = {
        "pnl": "pnl",
        "shares": "shares",
        "market_title": "question",
        "avg_price": "avg_price",
        "current_price": "current_price",
        "pi_amount": "pi_amount",
    }
    if order not in order_columns:
        raise ValueError("Invalid order")

    base_conditions: list[Any] = [
        MarketPosition.user_id == user_id,
        Market.is_active == True,
    ]
    if is_closed:
        base_conditions.append(MarketPosition.is_closed == True)
    else:
        base_conditions.append(MarketPosition.is_closed == False)

    if search and search.strip():
        base_conditions.append(Market.question.ilike(f"%{search}%"))

    yes_token = aliased(MarketToken)
    no_token = aliased(MarketToken)
    yes_price = func.coalesce(yes_token.price, 0)
    no_price = func.coalesce(no_token.price, 0)

    base_yes_stmt = (
        select(
            MarketPosition.id.label("id"),
            MarketPosition.market_id.label("market_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.token.label("token"),
            MarketPosition.side.label("side"),
            MarketPosition.outcome.label("outcome"),
            Market.question.label("question"),
            Market.icon.label("icon"),
            MarketPosition.shares.label("shares"),
            MarketPosition.pi_amount.label("pi_amount"),
            MarketPosition.avg_price.label("avg_price"),
            yes_price.label("current_price"),
            func.cast(MarketPosition.shares * yes_price - MarketPosition.pi_amount, Float).label("pnl"),
            func.cast((MarketPosition.shares * yes_price - MarketPosition.pi_amount) / MarketPosition.pi_amount * 100, Float).label("pnl_percent"),
            func.cast(MarketPosition.shares * yes_price, Float).label("current_pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .outerjoin(
            yes_token,
            and_(yes_token.market_id == Market.id, yes_token.outcome == "YES"),
        )
        .where(*base_conditions, MarketPosition.outcome == "YES")
    )
    base_no_stmt = (
        select(
            MarketPosition.id.label("id"),
            MarketPosition.market_id.label("market_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.token.label("token"),
            MarketPosition.side.label("side"),
            MarketPosition.outcome.label("outcome"),
            Market.question.label("question"),
            Market.icon.label("icon"),
            MarketPosition.shares.label("shares"),
            MarketPosition.pi_amount.label("pi_amount"),
            MarketPosition.avg_price.label("avg_price"),
            no_price.label("current_price"),
            func.cast(MarketPosition.shares * no_price - MarketPosition.pi_amount, Float).label("pnl"),
            func.cast((MarketPosition.shares * no_price - MarketPosition.pi_amount) / MarketPosition.pi_amount * 100, Float).label("pnl_percent"),
            func.cast(MarketPosition.shares * no_price, Float).label("current_pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .outerjoin(
            no_token,
            and_(no_token.market_id == Market.id, no_token.outcome == "NO"),
        )
        .where(*base_conditions, MarketPosition.outcome == "NO")
    )

    union_subquery = union_all(base_yes_stmt, base_no_stmt).subquery()
    order_column = union_subquery.c[order_columns[order]]
    order_expr = order_column.asc() if ascending else order_column.desc()

    stmt = (
        select(union_subquery)
        .order_by(order_expr)
        .limit(limit)
        .offset(offset)
    )

    result = await session.execute(stmt)
    rows = result.mappings().all()

    return rows


async def list_trades(
    session: AsyncSession,
    *,
    user_id: int,
    search: str = "",
    limit: int = 20,
    offset: int = 0,
    order: Optional[str] = "created_at",
    ascending: bool = False,
) -> List[dict[str, Any]]:
    order_columns = {
        "created_at": MarketTrade.created_at,
        "shares": MarketTrade.shares,
        "price": MarketTrade.price,
        "pi_amount": MarketTrade.pi_amount,
    }
    if order not in order_columns:
        raise ValueError("Invalid order")

    base_conditions: list[Any] = [MarketTrade.taker_user_id == user_id]
    if search and search.strip():
        base_conditions.append(Market.question.ilike(f"%{search}%"))

    order_column = order_columns[order]
    order_expr = order_column.asc() if ascending else order_column.desc()

    stmt = (
        select(
            MarketTrade.id.label("id"),
            MarketTrade.created_at.label("created_at"),
            MarketTrade.market_id.label("market_id"),
            Market.question.label("question"),
            Market.icon.label("icon"),
            MarketTrade.side.label("side"),
            MarketTrade.outcome.label("outcome"),
            MarketTrade.price.label("price"),
            MarketTrade.shares.label("shares"),
            MarketTrade.pi_amount.label("pi_amount"),
        )
        .join(Market, Market.id == MarketTrade.market_id)
        .where(*base_conditions)
        .order_by(order_expr)
        .limit(limit)
        .offset(offset)
    )

    result = await session.execute(stmt)
    return result.mappings().all()


async def get_total_markets_traded(
    session: AsyncSession,
    *,
    user_id: int,
) -> int:
    stmt = select(func.count(func.distinct(MarketTrade.market_id))).where(
        MarketTrade.taker_user_id == user_id
    )
    total = await session.scalar(stmt)
    return int(total or 0)


async def get_total_positions_value(
    session: AsyncSession,
    *,
    user_id: int,
) -> float:
    current_price = func.coalesce(MarketToken.price, 0)
    stmt = (
        select(
            func.coalesce(
                func.cast(func.sum(MarketPosition.shares * current_price), Float),
                0.0,
            )
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .outerjoin(
            MarketToken,
            and_(
                MarketToken.market_id == MarketPosition.market_id,
                cast(MarketToken.outcome, String) == MarketPosition.outcome,
            ),
        )
        .where(
            MarketPosition.user_id == user_id,
            Market.is_active == True,
        )
    )
    total_value = await session.scalar(stmt)
    return float(total_value or 0.0)


async def get_profit_loss_by_period(
    session: AsyncSession,
    *,
    user_id: int,
    period: str,
) -> dict[str, float | str]:
    since = _period_start(period)

    trade_stmt = select(
        MarketTrade.market_id,
        MarketTrade.side,
        MarketTrade.outcome,
        MarketTrade.shares,
        MarketTrade.pi_amount,
    ).where(MarketTrade.taker_user_id == user_id)
    if since is not None:
        trade_stmt = trade_stmt.where(MarketTrade.created_at >= since)

    trade_result = await session.execute(trade_stmt)
    trades = trade_result.all()
    if not trades:
        return {
            "period": period,
            "profit_loss": 0.0,
            "mark_value": 0.0,
            "cost_basis": 0.0,
        }

    position_stats: dict[int, dict[str, Decimal]] = {}
    for market_id, side, outcome, shares, pi_amount in trades:
        stat = position_stats.setdefault(
            market_id,
            {
                "yes_shares": Decimal("0"),
                "no_shares": Decimal("0"),
                "yes_pi_amount": Decimal("0"),
                "no_pi_amount": Decimal("0"),
            },
        )
        share_sign = Decimal("1") if side == "BUY" else Decimal("-1")
        amount_sign = Decimal("1") if side == "BUY" else Decimal("-1")
        safe_shares = _safe_decimal(shares)
        safe_pi_amount = _safe_decimal(pi_amount)
        if outcome == "YES":
            stat["yes_shares"] += safe_shares * share_sign
            stat["yes_pi_amount"] += safe_pi_amount * amount_sign
        elif outcome == "NO":
            stat["no_shares"] += safe_shares * share_sign
            stat["no_pi_amount"] += safe_pi_amount * amount_sign

    market_ids = list(position_stats.keys())
    market_stmt = select(
        MarketToken.market_id,
        MarketToken.outcome,
        MarketToken.price,
    ).where(MarketToken.market_id.in_(market_ids))
    market_result = await session.execute(market_stmt)
    market_map: dict[int, dict[str, Decimal]] = {}
    for market_id, outcome, price in market_result.all():
        bucket = market_map.setdefault(
            market_id,
            {"yes_price": Decimal("0"), "no_price": Decimal("0")},
        )
        if outcome == "YES":
            bucket["yes_price"] = _safe_decimal(price)
        elif outcome == "NO":
            bucket["no_price"] = _safe_decimal(price)

    mark_value = Decimal("0")
    cost_basis = Decimal("0")
    for market_id, stat in position_stats.items():
        market_price = market_map.get(market_id)
        if market_price is None:
            continue
        yes_shares = max(stat["yes_shares"], Decimal("0"))
        no_shares = max(stat["no_shares"], Decimal("0"))
        yes_pi_amount = max(stat["yes_pi_amount"], Decimal("0"))
        no_pi_amount = max(stat["no_pi_amount"], Decimal("0"))
        mark_value += (yes_shares * market_price["yes_price"]) + (
            no_shares * market_price["no_price"]
        )
        cost_basis += yes_pi_amount + no_pi_amount

    pnl = mark_value - cost_basis
    return {
        "period": period,
        "profit_loss": float(pnl),
        "mark_value": float(mark_value),
        "cost_basis": float(cost_basis),
    }


async def get_biggest_win(
    session: AsyncSession,
    *,
    user_id: int,
) -> dict[str, Any]:
    resolved_price = case(
        (
            (Market.resolved_outcome == "YES") & (MarketPosition.outcome == "YES"),
            1.0,
        ),
        (
            (Market.resolved_outcome == "NO") & (MarketPosition.outcome == "NO"),
            1.0,
        ),
        else_=0.0,
    )
    pnl_expr = func.cast(
        MarketPosition.shares * resolved_price - MarketPosition.pi_amount,
        Float,
    )

    stmt = (
        select(
            MarketPosition.market_id.label("market_id"),
            Market.question.label("question"),
            Market.icon.label("icon"),
            pnl_expr.label("profit"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .where(
            MarketPosition.user_id == user_id,
            Market.is_closed == True,
            Market.is_resolved == True,
            pnl_expr > 0,
        )
        .order_by(pnl_expr.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    row = result.mappings().first()

    if not row:
        return {
            "user_id": user_id,
            "market_id": None,
            "question": None,
            "icon": None,
            "biggest_win": 0.0,
        }
    return {
        "user_id": user_id,
        "market_id": row["market_id"],
        "question": row["question"],
        "icon": row["icon"],
        "biggest_win": float(row["profit"] or 0.0),
    }


async def get_pnl_history(
    session: AsyncSession,
    *,
    user_id: int,
    period: str,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    since = _period_start(period)

    all_start: Optional[datetime] = None
    if period == "ALL":
        all_start_stmt = select(func.min(MarketTrade.created_at)).where(
            MarketTrade.taker_user_id == user_id
        )
        all_start = await session.scalar(all_start_stmt)

    points = _build_history_points(period, now, all_start)
    if not points:
        return {"period": period, "history": []}

    if since is None:
        since = points[0]

    trade_stmt = (
        select(
            MarketTrade.market_id,
            MarketTrade.side,
            MarketTrade.outcome,
            MarketTrade.shares,
            MarketTrade.pi_amount,
            MarketTrade.created_at,
        )
        .where(
            MarketTrade.taker_user_id == user_id,
            MarketTrade.created_at >= since,
        )
        .order_by(MarketTrade.created_at.asc())
    )
    trade_result = await session.execute(trade_stmt)
    trades = trade_result.all()

    market_ids = list({trade.market_id for trade in trades})
    market_map: dict[int, dict[str, Decimal]] = {}
    if market_ids:
        market_stmt = select(
            MarketToken.market_id,
            MarketToken.outcome,
            MarketToken.price,
        ).where(MarketToken.market_id.in_(market_ids))
        market_result = await session.execute(market_stmt)
        for market_id, outcome, price in market_result.all():
            bucket = market_map.setdefault(
                market_id,
                {"yes_price": Decimal("0"), "no_price": Decimal("0")},
            )
            if outcome == "YES":
                bucket["yes_price"] = _safe_decimal(price)
            elif outcome == "NO":
                bucket["no_price"] = _safe_decimal(price)

    position_stats: dict[int, dict[str, Decimal]] = {}
    history: list[dict[str, Any]] = []
    trade_idx = 0

    for point in points:
        while trade_idx < len(trades) and trades[trade_idx].created_at <= point:
            trade = trades[trade_idx]
            stat = position_stats.setdefault(
                trade.market_id,
                {
                    "yes_shares": Decimal("0"),
                    "no_shares": Decimal("0"),
                    "yes_pi_amount": Decimal("0"),
                    "no_pi_amount": Decimal("0"),
                },
            )
            share_sign = Decimal("1") if trade.side == "BUY" else Decimal("-1")
            amount_sign = Decimal("1") if trade.side == "BUY" else Decimal("-1")
            safe_shares = _safe_decimal(trade.shares)
            safe_pi_amount = _safe_decimal(trade.pi_amount)
            if trade.outcome == "YES":
                stat["yes_shares"] += safe_shares * share_sign
                stat["yes_pi_amount"] += safe_pi_amount * amount_sign
            elif trade.outcome == "NO":
                stat["no_shares"] += safe_shares * share_sign
                stat["no_pi_amount"] += safe_pi_amount * amount_sign
            trade_idx += 1

        mark_value = Decimal("0")
        cost_basis = Decimal("0")
        for market_id, stat in position_stats.items():
            market_price = market_map.get(market_id)
            if market_price is None:
                continue
            yes_shares = max(stat["yes_shares"], Decimal("0"))
            no_shares = max(stat["no_shares"], Decimal("0"))
            yes_pi_amount = max(stat["yes_pi_amount"], Decimal("0"))
            no_pi_amount = max(stat["no_pi_amount"], Decimal("0"))
            mark_value += (yes_shares * market_price["yes_price"]) + (
                no_shares * market_price["no_price"]
            )
            cost_basis += yes_pi_amount + no_pi_amount

        pnl = mark_value - cost_basis
        history.append(
            {
                "timestamp": point.isoformat(),
                "profit_loss": float(pnl),
                "mark_value": float(mark_value),
                "cost_basis": float(cost_basis),
            }
        )

    return {"period": period, "history": history}


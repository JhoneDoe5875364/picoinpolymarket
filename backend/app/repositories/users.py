from __future__ import annotations

from sqlalchemy import Float, func, select, union_all, update
from typing import Any, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_trades import MarketTrade
from app.models.tables.user import User


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


async def get_user_balance_by_uuid(session: AsyncSession, pi_uid: str) -> Any:
    stmt = select(User).where(User.pi_uid == pi_uid)
    result = await session.execute(stmt)
    user_row = result.scalar_one_or_none()
    if not user_row:
        raise LookupError("User not found")
    return user_row.balance


async def update_user_status(
    session: AsyncSession, *, pi_uid: str, status: str
) -> dict[str, Any]:
    stmt = (
        update(User)
        .where(User.pi_uid == pi_uid)
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
    return dict(user_row)


async def list_positions(
    session: AsyncSession,
    *,
    user_id: int,
    status: Optional[str] = "ALL",
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
    if status not in ["ALL", "OPEN", "CLOSED"]:
        raise ValueError("Invalid status")

    base_conditions: list[Any] = [
        MarketPosition.user_id == user_id,
        Market.is_active == True,
    ]
    if status == "OPEN":
        base_conditions.append(Market.is_closed == False)
    elif status == "CLOSED":
        base_conditions.append(Market.is_closed == True)
    if search and search.strip():
        base_conditions.append(Market.question.ilike(f"%{search}%"))

    base_yes_stmt = (
        select(
            MarketPosition.id.label("id"),
            MarketPosition.market_id.label("market_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.token_id.label("token_id"),
            MarketPosition.side.label("side"),
            MarketPosition.outcome.label("outcome"),
            Market.question.label("question"),
            Market.icon.label("icon"),
            MarketPosition.shares.label("shares"),
            MarketPosition.pi_amount.label("pi_amount"),
            MarketPosition.avg_price.label("avg_price"),
            Market.outcome_price_yes.label("current_price"),
            func.cast(MarketPosition.shares * Market.outcome_price_yes - MarketPosition.pi_amount, Float).label("pnl"),
            func.cast((MarketPosition.shares * Market.outcome_price_yes - MarketPosition.pi_amount) / MarketPosition.pi_amount * 100, Float).label("pnl_percent"),
            func.cast(MarketPosition.shares * Market.outcome_price_yes, Float).label("current_pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .where(*base_conditions, MarketPosition.outcome == "YES")
    )
    base_no_stmt = (
        select(
            MarketPosition.id.label("id"),
            MarketPosition.market_id.label("market_id"),
            MarketPosition.user_id.label("user_id"),
            MarketPosition.token_id.label("token_id"),
            MarketPosition.side.label("side"),
            MarketPosition.outcome.label("outcome"),
            Market.question.label("question"),
            Market.icon.label("icon"),
            MarketPosition.shares.label("shares"),
            MarketPosition.pi_amount.label("pi_amount"),
            MarketPosition.avg_price.label("avg_price"),
            Market.outcome_price_no.label("current_price"),
            func.cast(MarketPosition.shares * Market.outcome_price_no - MarketPosition.pi_amount, Float).label("pnl"),
            func.cast((MarketPosition.shares * Market.outcome_price_no - MarketPosition.pi_amount) / MarketPosition.pi_amount * 100, Float).label("pnl_percent"),
            func.cast(MarketPosition.shares * Market.outcome_price_no, Float).label("current_pi_amount"),
        )
        .join(Market, Market.id == MarketPosition.market_id)
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


from __future__ import annotations

from sqlalchemy import func, select, union_all, update
from typing import Any, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition
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
        MarketPosition.user_id == user_id,
        Market.is_active == True,
    ]
    if status == "OPEN":
        base_conditions.append(Market.is_closed == False)
    elif status == "CLOSED":
        base_conditions.append(Market.is_closed == True)

    yes_stmt = (
        select(
            MarketPosition.market_id.label("id"),
            MarketPosition.id.label("position_id"),
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
            MarketPosition.market_id.label("id"),
            MarketPosition.id.label("position_id"),
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


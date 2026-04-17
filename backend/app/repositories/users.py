from __future__ import annotations

from sqlalchemy import select, union_all
from typing import Any, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition


async def list_users_page(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
    sort_by: str,
    order: str,
    search: str,
) -> Tuple[List[dict[str, Any]], int]:
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    where_sql = ""
    if search:
        where_sql = "WHERE pi_username ILIKE :search"
        params["search"] = f"%{search}%"

    query = text(
        f"""
        SELECT id, pi_username, status, balance, created_at
        FROM users
        {where_sql}
        ORDER BY {sort_by} {order}
        LIMIT :limit OFFSET :offset
        """
    )
    r = await session.execute(query, params)
    rows = [dict(x) for x in r.mappings().all()]

    cq = text(f"SELECT COUNT(*) AS total FROM users {where_sql}")
    cp = {k: v for k, v in params.items() if k in ("search",)}
    cr = await session.execute(cq, cp)
    total = cr.mappings().first()["total"] or 0
    return rows, int(total)


async def in_play_balance(session: AsyncSession, user_id: str) -> Any:
    q = text(
        """
        SELECT SUM(pi_amount) AS balance
        FROM v_portfolio_open_markets
        WHERE status = 'open' AND user_id = :uid
        """
    )
    r = await session.execute(q, {"uid": int(user_id)})
    row = r.mappings().first()
    if row is None or row["balance"] is None:
        return 0
    return row["balance"] or 0


async def update_user_status(
    session: AsyncSession, *, user_id: str, status: str
) -> dict[str, Any]:
    q = text(
        """
        UPDATE users SET status = :st WHERE id = :uid
        RETURNING id, pi_username, status, balance, created_at
        """
    )
    r = await session.execute(q, {"st": status, "uid": int(user_id)})
    row = r.mappings().first()
    if not row:
        raise LookupError("User not found")
    return dict(row)


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


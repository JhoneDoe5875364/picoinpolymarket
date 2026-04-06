from __future__ import annotations

from typing import Any, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


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
    r = await session.execute(q, {"uid": str(user_id)})
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
    r = await session.execute(q, {"st": status, "uid": user_id})
    row = r.mappings().first()
    if not row:
        raise LookupError("User not found")
    return dict(row)

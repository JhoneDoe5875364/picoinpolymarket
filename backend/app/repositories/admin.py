from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, List, Optional, Tuple

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.category import Category


async def resolve_category_id(
    session: AsyncSession,
    *,
    slug: Optional[str],
    explicit_id: Optional[uuid.UUID],
) -> Optional[uuid.UUID]:
    if explicit_id is not None:
        return explicit_id
    if not slug:
        return None
    r = await session.execute(select(Category.id).where(Category.slug == slug))
    return r.scalar_one_or_none()


async def insert_market_admin(
    session: AsyncSession,
    *,
    question: str,
    category_id: Optional[uuid.UUID],
    description: Optional[str],
    end_date_naive: datetime,
    resolution_date_utc_naive: datetime,
    checklist_resolution_clarity: bool,
    checklist_restricted_topics: bool,
) -> dict[str, Any]:
    q = text(
        """
        INSERT INTO markets (
            question, category_id, description, end_date, close_at, status,
            checklist_resolution_clarity, checklist_restricted_topics
        )
        VALUES (
            :question, :category_id, :description, :end_date, :close_at, 'open',
            :clarity, :restricted
        )
        RETURNING *
        """
    )
    r = await session.execute(
        q,
        {
            "question": question,
            "category_id": str(category_id) if category_id else None,
            "description": description,
            "end_date": end_date_naive,
            "close_at": resolution_date_utc_naive,
            "clarity": checklist_resolution_clarity,
            "restricted": checklist_restricted_topics,
        },
    )
    row = r.mappings().first()
    if not row:
        raise RuntimeError("Failed to create market")
    return dict(row)


async def admin_markets_page(
    session: AsyncSession,
    *,
    page: int,
    limit: int,
    sort_by: str,
    order: str,
    search: str,
    status: Optional[str],
) -> Tuple[int, List[dict[str, Any]]]:
    where_clauses: List[str] = []
    params: dict[str, Any] = {}

    if search:
        where_clauses.append("(question ILIKE :s1 OR description ILIKE :s2)")
        p = f"%{search}%"
        params["s1"] = p
        params["s2"] = p

    if status and status.lower() != "all":
        where_clauses.append("status = :st")
        params["st"] = status

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    offset = (page - 1) * limit
    params["limit"] = limit
    params["offset"] = offset

    count_q = text(f"SELECT COUNT(*) AS total FROM v_market_snapshots {where_sql}")
    cr = await session.execute(count_q, params)
    total = cr.mappings().first()["total"] or 0

    data_q = text(
        f"""
        SELECT id AS id, status AS status, title AS title, category AS category,
               created_at AS created_at, end_date AS end_date,
               COALESCE(total_pi, 0) AS total_pi,
               COALESCE(total_participants, 0) AS total_participants,
               COALESCE(total_volume, 0) AS total_volume,
               COALESCE(yes_volume, 0) AS yes_volume,
               COALESCE(no_volume, 0) AS no_volume,
               COALESCE(volume_24h, 0) AS volume_24h
        FROM v_market_snapshots
        {where_sql}
        ORDER BY {sort_by} {order}
        LIMIT :limit OFFSET :offset
        """
    )
    dr = await session.execute(data_q, params)
    rows = [dict(x) for x in dr.mappings().all()]
    return int(total), rows


async def admin_resolutions_page(
    session: AsyncSession,
    *,
    page: int,
    limit: int,
    sort_by: str,
    order: str,
    search: str,
) -> Tuple[int, List[dict[str, Any]]]:
    where_clauses = ["m.status = 'resolved'", "m.resolved = true"]
    params: dict[str, Any] = {}

    if search:
        where_clauses.append("(m.question ILIKE :s1 OR m.description ILIKE :s2)")
        p = f"%{search}%"
        params["s1"] = p
        params["s2"] = p

    where_sql = "WHERE " + " AND ".join(where_clauses)
    offset = (page - 1) * limit
    params["limit"] = limit
    params["offset"] = offset

    count_q = text(f"SELECT COUNT(*) AS total FROM markets m {where_sql}")
    cr = await session.execute(count_q, params)
    total = cr.mappings().first()["total"] or 0

    data_q = text(
        f"""
        SELECT m.id AS id, m.title AS title, m.description AS description,
               cat.slug AS category, m.created_at AS created_at, m.resolved_at AS resolved_at,
               m.resolved_by_username AS resolved_by_username, m.resolved_outcome AS resolved_outcome,
               COALESCE((
                   SELECT SUM(t.pi_amount)
                   FROM trades t
                   WHERE t.market_id = m.id AND COALESCE(t.invalid, false) = false
               ), 0) AS total_volume,
               m.status AS status
        FROM markets m
        LEFT JOIN categories cat ON cat.id = m.category_id
        {where_sql}
        ORDER BY {sort_by} {order}
        LIMIT :limit OFFSET :offset
        """
    )
    dr = await session.execute(data_q, params)
    return int(total), [dict(x) for x in dr.mappings().all()]


async def resolve_market_row(
    session: AsyncSession,
    *,
    market_id: int,
    outcome: str,
    user_id: str,
    username: str,
) -> dict[str, Any]:
    q = text(
        """
        UPDATE markets
        SET resolved_outcome = :outcome,
            resolved_at = NOW(),
            resolved = true,
            resolved_by_user_id = :uid,
            resolved_by_username = :uname,
            status = 'resolved'
        WHERE id = :mid
        RETURNING id, question, resolved, resolved_outcome, resolved_at, status
        """
    )
    r = await session.execute(
        q,
        {"outcome": outcome, "uid": user_id, "uname": username, "mid": market_id},
    )
    row = r.mappings().first()
    if not row:
        raise LookupError("Market not found")
    await session.execute(
        text("UPDATE trades SET invalid = false WHERE market_id = :mid"),
        {"mid": market_id},
    )
    return dict(row)


async def cancel_market_flow(session: AsyncSession, market_id: int) -> None:
    qm = text("SELECT * FROM markets m WHERE id = :mid")
    mr = await session.execute(qm, {"mid": market_id})
    market = mr.mappings().first()
    if not market:
        raise LookupError("MarketNotFound")

    qp = text(
        """
        SELECT user_id, SUM(pi_amount) AS total_amount
        FROM positions
        WHERE market_id = :mid
        GROUP BY user_id
        """
    )
    pr = await session.execute(qp, {"mid": market_id})
    open_positions = pr.mappings().all()

    um = text(
        """
        UPDATE markets SET status = 'cancelled' WHERE id = :mid RETURNING *
        """
    )
    await session.execute(um, {"mid": market_id})

    for pos in open_positions:
        uid = pos["user_id"]
        qu = text("SELECT id, balance FROM users WHERE id = :uid")
        ur = await session.execute(qu, {"uid": uid})
        user = ur.mappings().first()
        if not user:
            continue
        pi_amount = pos["total_amount"] or 0
        old_balance = user["balance"] or 0
        new_balance = old_balance + pi_amount
        await session.execute(
            text("UPDATE users SET balance = :bal WHERE id = :uid RETURNING *"),
            {"bal": new_balance, "uid": uid},
        )
        await session.execute(
            text(
                """
                INSERT INTO transactions (user_id, market_id, amount, pi_amount, type, status, details, date)
                VALUES (:uid, :mid, :amt, :amt, 'refund', 'completed', 'Refund due to cancellation', CURRENT_DATE)
                """
            ),
            {"uid": uid, "mid": market_id, "amt": pi_amount},
        )


async def platform_state_counts(session: AsyncSession) -> dict[str, Any]:
    total_users = (
        await session.execute(text("SELECT COUNT(*) AS count FROM users"))
    ).mappings().first()["count"] or 0

    open_markets = (
        await session.execute(
            text("SELECT COUNT(*) AS count FROM markets WHERE status = 'open'")
        )
    ).mappings().first()["count"] or 0

    resolved_markets = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS count FROM markets
                WHERE resolved = true AND status = 'resolved'
                """
            )
        )
    ).mappings().first()["count"] or 0

    locked_pi_row = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(total_volume), 0) AS total
                FROM v_market_snapshots
                WHERE status = 'open'
                """
            )
        )
    ).mappings().first()
    locked_pi = float(locked_pi_row["total"] or 0) if locked_pi_row else 0

    hist_row = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(pi_amount), 0) AS total
                FROM trades
                WHERE type IN ('buy', 'sell') AND COALESCE(invalid, false) = false
                """
            )
        )
    ).mappings().first()
    historical_pi = float(hist_row["total"] or 0) if hist_row else 0

    return {
        "total_users": int(total_users),
        "open_markets": int(open_markets),
        "resolved_markets": int(resolved_markets),
        "locked_pi": locked_pi,
        "historical_pi": historical_pi,
    }

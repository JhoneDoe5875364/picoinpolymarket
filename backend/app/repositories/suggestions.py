from __future__ import annotations

from datetime import timedelta
from typing import Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.category import Category


async def list_pending_suggestions(
    session: AsyncSession, *, offset: int, limit: int
) -> Tuple[List[dict[str, Any]], int]:
    r = await session.execute(
        text(
            """
            SELECT s.id::text AS id, s.user_id, u.pi_username, s.title, s.description,
                   s.category, s.status, s.end_time, s.created_at
            FROM suggestions s
            LEFT JOIN users u ON u.id = s.user_id
            WHERE s.status = 'pending'
            ORDER BY s.created_at DESC
            OFFSET :off LIMIT :lim
            """
        ),
        {"off": offset, "lim": limit},
    )
    rows = [dict(x) for x in r.mappings().all()]
    c = await session.execute(text("SELECT COUNT(*) AS c FROM suggestions"))
    total = c.mappings().first()["c"]
    return rows, int(total)


async def insert_suggestion(
    session: AsyncSession,
    *,
    user_id: str,
    title: str,
    category: str,
    description: Optional[str],
    end_time: Any,
) -> dict[str, Any]:
    r = await session.execute(
        text(
            """
            INSERT INTO suggestions (
                user_id, title, category, description, end_time, status
            )
            VALUES (:uid, :title, :cat, :desc, ' ', :end_time, 'pending')
            RETURNING *
            """
        ),
        {
            "uid": user_id,
            "title": title,
            "cat": category,
            "desc": description,
            "end_time": end_time,
        },
    )
    row = r.mappings().first()
    if not row:
        raise RuntimeError("Failed to create suggestion")
    return dict(row)


async def get_suggestion_public(
    session: AsyncSession, suggestion_id: UUID
) -> Optional[dict[str, Any]]:
    r = await session.execute(
        text(
            """
            SELECT id::text AS id, title, description, category, status,
                   end_time, created_at
            FROM suggestions WHERE id = :sid
            """
        ),
        {"sid": str(suggestion_id)},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def approve_suggestion_create_market(
    session: AsyncSession, *, suggestion_id: UUID, status: str
) -> dict[str, Any]:
    sr = await session.execute(
        text(
            """
            SELECT id::text AS id, title, description, category, end_time
            FROM suggestions WHERE id = :sid
            """
        ),
        {"sid": str(suggestion_id)},
    )
    suggestion = sr.mappings().first()
    if not suggestion:
        raise LookupError("Suggestion not found")
    if not suggestion.get("end_time"):
        raise ValueError("Suggestion end_time is missing")

    resolution_date = suggestion["end_time"] + timedelta(days=1)

    cat_r = await session.execute(
        select(Category.id).where(Category.slug == suggestion["category"])
    )
    category_id = cat_r.scalar_one_or_none()
    if category_id is None:
        raise ValueError(f"Unknown market category slug: {suggestion['category']!r}")

    await session.execute(
        text("UPDATE suggestions SET status = :st WHERE id = :sid"),
        {"st": status, "sid": str(suggestion_id)},
    )

    mr = await session.execute(
        text(
            """
            INSERT INTO markets (
                question, category_id, description, end_date, close_at, status,
                checklist_resolution_clarity, checklist_restricted_topics
            )
            VALUES (:q, :cid, :desc, :end_t, :close_at, 'open', true, true)
            RETURNING *
            """
        ),
        {
            "q": suggestion["title"],
            "cid": str(category_id),
            "desc": suggestion["description"],
            "end_t": suggestion["end_time"],
            "close_at": resolution_date,
        },
    )
    market_row = mr.mappings().first()
    if not market_row:
        raise RuntimeError("Failed to create market")
    return dict(market_row)

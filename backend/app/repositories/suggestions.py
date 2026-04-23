from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, List, Optional, Tuple

from sqlalchemy import func, inspect as sa_inspect, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.suggestion import Suggestion
from app.models.tables.user import User

_SLUG_CLEANUP_PATTERN = re.compile(r"[^a-z0-9]+")


def _serialize_suggestion(row: Suggestion, *, username: Optional[str] = None) -> dict[str, Any]:
    payload = {col.key: getattr(row, col.key) for col in sa_inspect(Suggestion).mapper.columns}
    payload["pi_username"] = username
    return payload


def _slugify_text(value: str) -> str:
    normalized = _SLUG_CLEANUP_PATTERN.sub("-", value.strip().lower()).strip("-")
    return normalized or "market"


async def _build_unique_market_slug(session: AsyncSession, question: str, requested_slug: Optional[str]) -> str:
    base_slug = _slugify_text(requested_slug or question)
    slug = base_slug
    dedupe_seq = 2
    while True:
        existing = await session.execute(select(Market.id).where(Market.slug == slug).limit(1))
        if existing.scalar_one_or_none() is None:
            return slug
        slug = f"{base_slug}-{dedupe_seq}"
        dedupe_seq += 1


async def list_suggestions(
    session: AsyncSession,
    *,
    status: Optional[str],
    offset: int,
    limit: int,
) -> Tuple[List[dict[str, Any]], int]:
    base_stmt = (
        select(Suggestion, User.pi_username)
        .outerjoin(User, User.id == Suggestion.user_id)
        .order_by(Suggestion.created_at.desc().nullslast(), Suggestion.id.desc())
    )
    if status and status.strip().lower() != "all":
        base_stmt = base_stmt.where(func.lower(Suggestion.status) == status.strip().lower())

    result = await session.execute(base_stmt.offset(offset).limit(limit))
    rows = [_serialize_suggestion(suggestion_row, username=username) for suggestion_row, username in result.all()]

    count_stmt = select(func.count(Suggestion.id))
    if status and status.strip().lower() != "all":
        count_stmt = count_stmt.where(func.lower(Suggestion.status) == status.strip().lower())
    total_result = await session.execute(count_stmt)
    total = int(total_result.scalar_one() or 0)
    return rows, total


async def list_categories(session: AsyncSession) -> List[dict[str, Any]]:
    result = await session.execute(
        select(Category.id, Category.slug, Category.name).order_by(Category.slug.asc())
    )
    return [
        {"id": row.id, "slug": row.slug, "name": row.name or row.slug}
        for row in result.all()
    ]


async def insert_suggestion(
    session: AsyncSession,
    *,
    user_id: int,
    question: str,
    category: str,
    description: Optional[str],
    start_date: datetime,
    end_date: datetime,
) -> dict[str, Any]:
    # Keep the PostgreSQL sequence in sync when rows were inserted with explicit ids.
    await session.execute(
        text(
            """
            SELECT setval(
                pg_get_serial_sequence('suggestions', 'id'),
                COALESCE((SELECT MAX(id) FROM suggestions), 0) + 1,
                false
            )
            """
        )
    )

    now_utc = datetime.now(timezone.utc)
    row = Suggestion(
        user_id=user_id,
        question=question,
        category=category,
        description=description,
        start_date=start_date,
        end_date=end_date,
        status="pending",
        created_at=now_utc,
        updated_at=now_utc,
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    return _serialize_suggestion(row)


async def get_suggestion(
    session: AsyncSession, suggestion_id: int
) -> Optional[dict[str, Any]]:
    result = await session.execute(
        select(Suggestion, User.pi_username)
        .outerjoin(User, User.id == Suggestion.user_id)
        .where(Suggestion.id == suggestion_id)
    )
    row = result.one_or_none()
    if row is None:
        return None
    suggestion_row, username = row
    return _serialize_suggestion(suggestion_row, username=username)


async def reject_suggestion(
    session: AsyncSession,
    *,
    suggestion_id: int,
    reviewer_id: int,
    reason: Optional[str],
) -> dict[str, Any]:
    result = await session.execute(select(Suggestion).where(Suggestion.id == suggestion_id))
    suggestion = result.scalar_one_or_none()
    if suggestion is None:
        raise LookupError("Suggestion not found")
    if suggestion.status != "pending":
        raise ValueError("Only pending suggestions can be rejected")

    now_utc = datetime.now(timezone.utc)
    suggestion.status = "rejected"
    suggestion.reject_reason = (reason or "").strip() or None
    suggestion.reviewed_by = reviewer_id
    suggestion.reviewed_at = now_utc
    suggestion.updated_at = now_utc
    await session.flush()
    return _serialize_suggestion(suggestion)


async def approve_suggestion_create_market(
    session: AsyncSession,
    *,
    suggestion_id: int,
    reviewer_id: int,
    question: str,
    description: Optional[str],
    slug: Optional[str],
    rules: Optional[str],
    category: str,
    liquidity: Optional[Decimal],
    start_date: datetime,
    end_date: datetime,
    image: Optional[str],
) -> dict[str, Any]:
    result = await session.execute(select(Suggestion).where(Suggestion.id == suggestion_id))
    suggestion = result.scalar_one_or_none()
    if suggestion is None:
        raise LookupError("Suggestion not found")
    if suggestion.status != "pending":
        raise ValueError("Only pending suggestions can be approved")

    cat_result = await session.execute(select(Category.id).where(Category.slug == category))
    category_id = cat_result.scalar_one_or_none()
    if category_id is None:
        raise ValueError(f"Unknown category: {category}")

    resolved_slug = await _build_unique_market_slug(session, question=question, requested_slug=slug)
    now_utc = datetime.now(timezone.utc)
    market = Market(
        question=question,
        slug=resolved_slug,
        description=description,
        rules=rules,
        category_id=category_id,
        liquidity=liquidity,
        start_date=start_date,
        end_date=end_date,
        icon=image,
        status="open",
        is_active=True,
        is_closed=False,
        is_resolved=False,
        created_at=now_utc,
        updated_at=now_utc,
    )
    session.add(market)
    await session.flush()
    await session.refresh(market)

    suggestion.status = "approved"
    suggestion.reject_reason = None
    suggestion.reviewed_by = reviewer_id
    suggestion.reviewed_at = now_utc
    suggestion.updated_at = now_utc
    await session.flush()

    return {
        "suggestion": _serialize_suggestion(suggestion),
        "market": {col.name: getattr(market, col.name) for col in Market.__table__.columns},
    }

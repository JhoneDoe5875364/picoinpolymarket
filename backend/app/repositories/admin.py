from __future__ import annotations

import re
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional, Tuple

from sqlalchemy import case, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_token import MarketToken


_SLUG_CLEANUP_PATTERN = re.compile(r"[^a-z0-9]+")


def _slugify_question(question: str) -> str:
    normalized = _SLUG_CLEANUP_PATTERN.sub("-", question.strip().lower()).strip("-")
    return normalized or "market"


async def _build_unique_market_slug(session: AsyncSession, question: str) -> str:
    base_slug = _slugify_question(question)
    slug = base_slug
    dedupe_seq = 2
    while True:
        existing = await session.execute(select(Market.id).where(Market.slug == slug).limit(1))
        if existing.scalar_one_or_none() is None:
            return slug
        slug = f"{base_slug}-{dedupe_seq}"
        dedupe_seq += 1


async def get_category_by_slug(
    session: AsyncSession,
    *,
    slug: Optional[str],
    explicit_id: Optional[int],
) -> Optional[int]:
    if explicit_id is not None:
        return explicit_id
    if not slug:
        return None
    r = await session.execute(select(Category.id).where(Category.slug == slug))
    return r.scalar_one_or_none()


async def insert_market(
    session: AsyncSession,
    *,
    question: str,
    slug: str,
    category_id: Optional[int],
    description: Optional[str],
    rules: Optional[str],
    start_date_naive: datetime,
    end_date_naive: datetime,
    liquidity: Optional[Decimal],
    icon: Optional[str],
) -> dict[str, Any]:
    market = Market(
        question=question,
        slug=slug,
        category_id=category_id,
        description=description,
        rules=rules,
        start_date=start_date_naive,
        end_date=end_date_naive,
        liquidity=liquidity,
        icon=icon,
        status="open",
    )
    session.add(market)
    await session.flush()
    await session.refresh(market)
    return {
        col.name: getattr(market, col.name)
        for col in Market.__table__.columns
    }


async def close_market(
    session: AsyncSession,
    *,
    market_id: int,
) -> dict[str, Any]:
    update_stmt = (
        update(Market)
        .where(
            Market.id == market_id,
            func.coalesce(Market.is_resolved, False) == False,
        )
        .values(
            is_closed=True,
            status=case(
                (Market.status == "open", "pending"),
                else_=Market.status,
            ),
            updated_at=datetime.now(),
        )
        .returning(
            Market.id,
            Market.question,
            Market.status,
            Market.is_closed,
            Market.is_resolved,
            Market.updated_at,
        )
    )
    updated = await session.execute(update_stmt)
    updated_row = updated.mappings().first()
    if updated_row:
        return dict(updated_row)

    exists_stmt = select(
        Market.id,
        func.coalesce(Market.is_resolved, False).label("is_resolved"),
    ).where(Market.id == market_id)
    exists_result = await session.execute(exists_stmt)
    existing_row = exists_result.mappings().first()
    if not existing_row:
        raise LookupError("Market not found")
    if existing_row["is_resolved"]:
        raise ValueError("Resolved market cannot be closed")
    raise ValueError("Market cannot be closed")


async def resolve_market(
    session: AsyncSession,
    *,
    market_id: int,
    outcome: str,
    user_id: str,
    username: str,
) -> dict[str, Any]:
    final_price_value = Decimal("1") if outcome == "YES" else Decimal("0")
    loser_price_value = Decimal("0") if outcome == "YES" else Decimal("1")
    update_stmt = (
        update(Market)
        .where(Market.id == market_id)
        .values(
            resolved_outcome=outcome,
            resolved_at=datetime.now(),
            is_resolved=True,
            is_closed=True,
            resolved_by_user_id=user_id,
            resolved_by_username=username,
            status="resolved",
            updated_at=datetime.now(),
        )
        .returning(
            Market.id,
            Market.question,
            Market.status,
            Market.is_closed,
            Market.is_resolved,
            Market.resolved_outcome,
            Market.resolved_at,
        )
    )
    updated = await session.execute(update_stmt)
    updated_row = updated.mappings().first()
    if not updated_row:
        raise LookupError("Market not found")

    await session.execute(
        update(MarketPosition)
        .where(
            MarketPosition.market_id == market_id,
            MarketPosition.final_price.is_(None),
        )
        .values(
            is_closed=True,
            final_price=case(
                (MarketPosition.outcome == outcome, final_price_value),
                else_=loser_price_value,
            )
        )
    )
    await session.execute(
        update(MarketToken)
        .where(MarketToken.market_id == market_id)
        .values(
            price=case(
                (MarketToken.outcome == outcome, final_price_value),
                else_=loser_price_value,
            )
        )
    )

    return dict(updated_row)


async def metrics(session: AsyncSession) -> dict[str, Any]:
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

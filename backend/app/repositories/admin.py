from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, List, Optional, Tuple

from sqlalchemy import and_, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_trades import MarketTrade
from app.models.tables.market_token import MarketToken
from app.models.tables.suggestion import Suggestion
from app.models.tables.user import User


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
    yes_criteria: Optional[str],
    no_criteria: Optional[str],
    edge_cases: Optional[str],
    market_context: Optional[str],
    resolution_source: Optional[str],
    resolution_time: Optional[datetime],
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
        yes_criteria=yes_criteria,
        no_criteria=no_criteria,
        edge_cases=edge_cases,
        market_context=market_context,
        resolution_source=resolution_source,
        resolution_time=resolution_time,
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


async def update_market(
    session: AsyncSession,
    *,
    market_id: int,
    question: str,
    slug: str,
    category_id: Optional[int],
    description: Optional[str],
    rules: Optional[str],
    yes_criteria: Optional[str],
    no_criteria: Optional[str],
    edge_cases: Optional[str],
    market_context: Optional[str],
    resolution_source: Optional[str],
    resolution_time: Optional[datetime],
    start_date_naive: datetime,
    end_date_naive: datetime,
    liquidity: Optional[Decimal],
    icon: Optional[str],
) -> dict[str, Any]:
    update_stmt = (
        update(Market)
        .where(Market.id == market_id)
        .values(
            question=question,
            slug=slug,
            category_id=category_id,
            description=description,
            rules=rules,
            yes_criteria=yes_criteria,
            no_criteria=no_criteria,
            edge_cases=edge_cases,
            market_context=market_context,
            resolution_source=resolution_source,
            resolution_time=resolution_time,
            start_date=start_date_naive,
            end_date=end_date_naive,
            liquidity=liquidity,
            icon=icon,
            updated_at=datetime.now(timezone.utc),
        )
        .returning(*Market.__table__.columns)
    )
    updated = await session.execute(update_stmt)
    updated_row = updated.mappings().first()
    if not updated_row:
        raise LookupError("Market not found")
    return dict(updated_row)


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
            closed_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
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
    now = datetime.now(timezone.utc)
    update_stmt = (
        update(Market)
        .where(Market.id == market_id)
        .values(
            resolved_outcome=outcome,
            resolved_at=now,
            is_resolved=True,
            is_closed=True,
            closed_at=case(
                (Market.closed_at.is_(None), now),
                else_=Market.closed_at,
            ),
            resolved_by_user_id=user_id,
            resolved_by_username=username,
            status="resolved",
            updated_at=now,
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
    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_week = start_today - timedelta(days=start_today.weekday())
    start_month = start_today.replace(day=1)
    start_year = start_today.replace(month=1, day=1)

    periods: list[Tuple[str, Optional[datetime]]] = [
        ("today", start_today),
        ("week", start_week),
        ("month", start_month),
        ("year", start_year),
        ("all", None),
    ]

    is_resolved_expr = or_(
        func.coalesce(Market.is_resolved, False) == True,
        Market.status == "resolved",
    )
    is_closed_expr = and_(
        Market.closed_at.is_not(None),
        Market.closed_at <= now,
    )
    is_pending_expr = and_(
        ~is_resolved_expr,
        or_(
            func.coalesce(Market.is_closed, False) == True,
            Market.status == "pending",
            is_closed_expr,
        ),
    )
    is_open_expr = and_(
        ~is_resolved_expr,
        ~is_pending_expr,
    )
    resolved_time_expr = func.coalesce(Market.resolved_at, Market.closed_at, Market.updated_at)

    def build_count_columns(ts_column: Any) -> list[Any]:
        return [
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                ts_column.is_not(None),
                                ts_column <= now,
                                ts_column >= start_at if start_at is not None else True,
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label(label)
            for label, start_at in periods
        ]

    def build_sum_columns(ts_column: Any, value_column: Any, *, positive_only: bool = False) -> list[Any]:
        return [
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                ts_column.is_not(None),
                                ts_column <= now,
                                ts_column >= start_at if start_at is not None else True,
                                value_column.is_not(None),
                                value_column > 0 if positive_only else True,
                            ),
                            value_column,
                        ),
                        else_=Decimal("0"),
                    )
                ),
                Decimal("0"),
            ).label(label)
            for label, start_at in periods
        ]

    market_status_stmt = select(
        func.count(Market.id).label("total"),
        func.coalesce(func.sum(case((is_open_expr, 1), else_=0)), 0).label("open_count"),
        func.coalesce(func.sum(case((is_pending_expr, 1), else_=0)), 0).label("pending_count"),
        func.coalesce(func.sum(case((is_resolved_expr, 1), else_=0)), 0).label("resolved_count"),
    )
    market_status_row = (await session.execute(market_status_stmt)).one()

    market_created_stmt = select(*build_count_columns(Market.created_at))
    market_created_row = (await session.execute(market_created_stmt)).mappings().one()

    market_closed_stmt = select(
        *[
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                is_closed_expr,
                                Market.closed_at >= start_at if start_at is not None else True,
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label(label)
            for label, start_at in periods
        ]
    )
    market_closed_row = (await session.execute(market_closed_stmt)).mappings().one()

    market_resolved_stmt = select(
        *[
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                is_resolved_expr,
                                resolved_time_expr.is_not(None),
                                resolved_time_expr <= now,
                                resolved_time_expr >= start_at if start_at is not None else True,
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label(label)
            for label, start_at in periods
        ]
    )
    market_resolved_row = (await session.execute(market_resolved_stmt)).mappings().one()

    purchased_pi_stmt = select(
        *build_sum_columns(
            MarketTrade.created_at,
            MarketTrade.pi_amount,
            positive_only=True,
        )
    ).where(MarketTrade.side == "BUY")
    purchased_pi_row = (await session.execute(purchased_pi_stmt)).mappings().one()

    fee_stmt = select(*build_sum_columns(MarketTrade.created_at, MarketTrade.pi_fee, positive_only=True))
    fee_row = (await session.execute(fee_stmt)).mappings().one()

    claimed_pi_expr = (MarketPosition.shares * MarketPosition.final_price)
    claimed_pi_stmt = select(*build_sum_columns(MarketPosition.updated_at, claimed_pi_expr, positive_only=True)).where(
        MarketPosition.is_claimed == True,
        MarketPosition.final_price.is_not(None),
    )
    claimed_pi_row = (await session.execute(claimed_pi_stmt)).mappings().one()

    users_created_stmt = select(*build_count_columns(User.created_at))
    users_created_row = (await session.execute(users_created_stmt)).mappings().one()

    suggestions_created_stmt = select(*build_count_columns(Suggestion.created_at))
    suggestions_created_row = (await session.execute(suggestions_created_stmt)).mappings().one()

    unresolved_closed_stmt = (
        select(
            Market.id,
            Market.question,
            Market.icon,
            Market.status,
            Market.end_date,
            Market.updated_at,
        )
        .where(
            is_pending_expr,
        )
        .order_by(Market.end_date.desc().nullslast(), Market.id.desc())
    )
    unresolved_closed_rows = (await session.execute(unresolved_closed_stmt)).mappings().all()

    return {
        "market_status": {
            "total": int(market_status_row.total or 0),
            "open": int(market_status_row.open_count or 0),
            "pending": int(market_status_row.pending_count or 0),
            "resolved": int(market_status_row.resolved_count or 0),
        },
        "market_count_created": {k: int(market_created_row[k] or 0) for k, _ in periods},
        "market_count_closed": {k: int(market_closed_row[k] or 0) for k, _ in periods},
        "market_count_resolved": {k: int(market_resolved_row[k] or 0) for k, _ in periods},
        "total_pi_purchased": {k: float(purchased_pi_row[k] or 0) for k, _ in periods},
        "total_fee_generated": {k: float(fee_row[k] or 0) for k, _ in periods},
        "total_pi_claimed": {k: float(claimed_pi_row[k] or 0) for k, _ in periods},
        "user_count_created": {k: int(users_created_row[k] or 0) for k, _ in periods},
        "suggestion_count_created": {k: int(suggestions_created_row[k] or 0) for k, _ in periods},
        "closed_unresolved_markets": [dict(row) for row in unresolved_closed_rows],
    }

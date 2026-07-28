from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, List, Optional, Tuple

from sqlalchemy import and_, case, exists, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.category import Category
from app.models.tables.comment import Comment
from app.models.tables.leaderboard import Leaderboard
from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_trades import MarketTrade
from app.models.tables.market_token import MarketToken
from app.models.tables.order import Order
from app.models.tables.payment import Payment
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


async def set_market_admin_clarification(
    session: AsyncSession,
    *,
    market_id: int,
    clarification: Optional[str],
    user_id: str,
    username: str,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    if clarification:
        values = {
            "admin_clarification": clarification,
            "admin_clarification_at": now,
            "admin_clarification_by_user_id": user_id,
            "admin_clarification_by_username": username or None,
            "updated_at": now,
        }
    else:
        values = {
            "admin_clarification": None,
            "admin_clarification_at": None,
            "admin_clarification_by_user_id": None,
            "admin_clarification_by_username": None,
            "updated_at": now,
        }

    update_stmt = (
        update(Market)
        .where(Market.id == market_id)
        .values(**values)
        .returning(
            Market.id,
            Market.admin_clarification,
            Market.admin_clarification_at,
            Market.admin_clarification_by_user_id,
            Market.admin_clarification_by_username,
            Market.updated_at,
        )
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


def _wallet_present_expr():
    return and_(
        User.wallet_address.isnot(None),
        func.trim(User.wallet_address) != "",
    )


async def payment_operations_overview(session: AsyncSession) -> dict[str, Any]:
    """Aggregates for admin payment / payout monitoring (best-effort from current schema)."""
    received_stmt = select(
        func.count(Payment.id),
        func.coalesce(func.sum(Payment.amount), 0),
    ).where(Payment.status == "COMPLETED")
    received_row = (await session.execute(received_stmt)).one()

    pending_stmt = select(
        func.count(Payment.id),
        func.coalesce(func.sum(Payment.amount), 0),
    ).where(Payment.status == "PENDING")
    pending_row = (await session.execute(pending_stmt)).one()

    failed_stmt = select(
        func.count(Payment.id),
        func.coalesce(func.sum(Payment.amount), 0),
    ).where(Payment.status == "FAILED")
    failed_row = (await session.execute(failed_stmt)).one()

    manual_stmt = select(
        func.count(Payment.id),
        func.coalesce(func.sum(Payment.amount), 0),
    ).where(Payment.status == "APPROVED")
    manual_row = (await session.execute(manual_stmt)).one()

    mismatch_stmt = (
        select(func.count())
        .select_from(Payment)
        .join(Order, Order.id == Payment.order_id)
        .where(Payment.amount != Order.pi_amount)
    )
    mismatch_count = int(await session.scalar(mismatch_stmt) or 0)

    wallet_connected_stmt = select(func.count()).select_from(User).where(
        _wallet_present_expr()
    )
    wallet_connected = int(await session.scalar(wallet_connected_stmt) or 0)

    wallet_missing_stmt = select(func.count()).select_from(User).where(
        User.role_id == 3,
        ~_wallet_present_expr(),
    )
    wallet_missing = int(await session.scalar(wallet_missing_stmt) or 0)

    return {
        "user_to_app_payments_received": {
            "count": int(received_row[0] or 0),
            "total_pi": float(received_row[1] or 0),
        },
        "app_to_user_payouts_sent": {
            "count": 0,
            "total_pi": 0.0,
            "tracking_note": "On-chain app-to-user payouts are not stored in this database yet.",
        },
        "pending_payouts": {
            "count": int(pending_row[0] or 0),
            "total_pi": float(pending_row[1] or 0),
            "scope_note": "Pi payments awaiting user wallet action (user→app).",
        },
        "failed_payouts": {
            "count": int(failed_row[0] or 0),
            "total_pi": float(failed_row[1] or 0),
            "scope_note": "Failed Pi payment records linked to orders.",
        },
        "manual_payout_queue": {
            "count": int(manual_row[0] or 0),
            "total_pi": float(manual_row[1] or 0),
            "scope_note": "Approved server-side; may still need Pi complete / manual follow-up.",
        },
        "wallet_address_connected_users": wallet_connected,
        "wallet_address_missing_users": wallet_missing,
        "wallet_scope_note": "Based on users who have saved a payout wallet address.",
        "payment_mismatch_warnings": {
            "count": mismatch_count,
            "scope_note": "Payment.amount differs from orders.pi_amount for the linked order.",
        },
    }


async def list_admin_payments(
    session: AsyncSession,
    *,
    status: str = "ALL",
    limit: int = 20,
    offset: int = 0,
) -> Tuple[List[dict[str, Any]], int]:
    allowed = {"ALL", "PENDING", "APPROVED", "COMPLETED", "FAILED", "CANCELLED"}
    if status not in allowed:
        raise ValueError("Invalid status filter")

    mismatch_expr = Payment.amount != Order.pi_amount

    base = (
        select(
            Payment.id,
            Payment.user_id,
            User.pi_username,
            Payment.order_id,
            Payment.amount,
            Order.pi_amount.label("order_pi_amount"),
            Payment.status,
            Payment.pi_payment_id,
            Payment.txid,
            Payment.created_at,
            mismatch_expr.label("amount_mismatch"),
        )
        .join(User, User.id == Payment.user_id)
        .join(Order, Order.id == Payment.order_id)
    )
    if status != "ALL":
        base = base.where(Payment.status == status)

    count_base = (
        select(func.count())
        .select_from(Payment)
        .join(User, User.id == Payment.user_id)
        .join(Order, Order.id == Payment.order_id)
    )
    if status != "ALL":
        count_base = count_base.where(Payment.status == status)

    total = int(await session.scalar(count_base) or 0)

    list_stmt = base.order_by(Payment.created_at.desc()).limit(limit).offset(offset)
    result = await session.execute(list_stmt)
    rows: List[dict[str, Any]] = []
    for r in result.mappings().all():
        row = dict(r)
        row["amount"] = float(row["amount"] or 0)
        row["order_pi_amount"] = float(row["order_pi_amount"] or 0)
        row["amount_mismatch"] = bool(row.get("amount_mismatch"))
        rows.append(row)
    return rows, total


def _user_wallet_subquery():
    # Payout destination lives on users (set by the user), not leaderboards
    # (which the updater rebuilds with NULL).
    return (
        select(User.wallet_address)
        .where(
            User.id == MarketPosition.user_id,
            User.wallet_address.isnot(None),
            func.trim(User.wallet_address) != "",
        )
        .limit(1)
        .scalar_subquery()
    )


async def list_payout_queue(
    session: AsyncSession,
    *,
    status: str = "pending",
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[dict[str, Any]], int]:
    """
    Per-user winning positions on resolved markets awaiting manual Pi payout.
    amount_owed = shares (winners have final_price = 1).
    """
    allowed_status = {"ALL", "pending", "paid"}
    if status not in allowed_status:
        raise ValueError("Invalid status filter")

    winner_expr = MarketPosition.final_price >= Decimal("1")
    base_filters = [
        Market.is_resolved == True,
        winner_expr,
        MarketPosition.shares > 0,
    ]
    if status == "pending":
        base_filters.append(MarketPosition.is_claimed == False)
    elif status == "paid":
        base_filters.append(MarketPosition.is_claimed == True)

    amount_owed_expr = MarketPosition.shares * MarketPosition.final_price
    wallet_expr = _user_wallet_subquery()

    count_stmt = (
        select(func.count())
        .select_from(MarketPosition)
        .join(Market, Market.id == MarketPosition.market_id)
        .join(User, User.id == MarketPosition.user_id)
        .where(*base_filters)
    )
    total = int(await session.scalar(count_stmt) or 0)

    list_stmt = (
        select(
            MarketPosition.id.label("position_id"),
            MarketPosition.user_id,
            User.pi_username,
            MarketPosition.market_id,
            Market.question.label("market_question"),
            MarketPosition.outcome,
            amount_owed_expr.label("amount_owed"),
            wallet_expr.label("wallet_address"),
            MarketPosition.is_claimed,
            Market.resolved_at,
            MarketPosition.updated_at,
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .join(User, User.id == MarketPosition.user_id)
        .where(*base_filters)
        .order_by(Market.resolved_at.desc().nullslast(), MarketPosition.id.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(list_stmt)
    rows: List[dict[str, Any]] = []
    for r in result.mappings().all():
        row = dict(r)
        row["amount_owed"] = float(row["amount_owed"] or 0)
        row["payment_status"] = "paid" if row.pop("is_claimed") else "pending"
        row["txid"] = None
        row["pi_username"] = row.get("pi_username")
        rows.append(row)
    return rows, total


async def mark_payout_paid(
    session: AsyncSession,
    *,
    position_id: int,
) -> dict[str, Any]:
    """Mark a winning position as claimed (manual payout completed)."""
    stmt = (
        select(
            MarketPosition.id,
            MarketPosition.user_id,
            MarketPosition.market_id,
            MarketPosition.outcome,
            MarketPosition.shares,
            MarketPosition.final_price,
            MarketPosition.is_claimed,
            Market.question,
            User.pi_username,
        )
        .join(Market, Market.id == MarketPosition.market_id)
        .join(User, User.id == MarketPosition.user_id)
        .where(MarketPosition.id == position_id)
        .limit(1)
    )
    row = (await session.execute(stmt)).mappings().first()
    if row is None:
        raise LookupError("Payout position not found")
    if row["is_claimed"]:
        raise ValueError("Payout already marked paid")
    if row["final_price"] is None or Decimal(str(row["final_price"])) < Decimal("1"):
        raise ValueError("Position is not a winning payout")

    now = datetime.now(timezone.utc)
    await session.execute(
        update(MarketPosition)
        .where(MarketPosition.id == position_id)
        .values(is_claimed=True, updated_at=now)
    )
    amount_owed = float(Decimal(str(row["shares"] or 0)) * Decimal(str(row["final_price"] or 0)))
    return {
        "position_id": int(row["id"]),
        "user_id": int(row["user_id"]),
        "pi_username": row["pi_username"],
        "market_id": int(row["market_id"]),
        "market_question": row["question"],
        "outcome": row["outcome"],
        "amount_owed": amount_owed,
        "payment_status": "paid",
    }


HIGH_COMMENT_WEEK_THRESHOLD = 12
LARGE_TRADE_PI_THRESHOLD = Decimal("500")


async def trust_safety_dashboard(session: AsyncSession) -> dict[str, Any]:
    """Operational trust & safety signals derived from current schema (best-effort)."""
    now = datetime.now(timezone.utc)
    seven_ago = now - timedelta(days=7)

    mismatch_stmt = (
        select(func.count())
        .select_from(Payment)
        .join(Order, Order.id == Payment.order_id)
        .where(Payment.amount != Order.pi_amount)
    )
    payment_mismatch_count = int(await session.scalar(mismatch_stmt) or 0)

    failed_7d_stmt = select(func.count()).where(
        Payment.status == "FAILED",
        Payment.created_at >= seven_ago,
    )
    failed_payments_7d = int(await session.scalar(failed_7d_stmt) or 0)

    blocked_markets_count_stmt = select(func.count(func.distinct(Comment.market_id))).where(
        Comment.status == "blocked",
    )
    markets_with_blocked_comments = int(await session.scalar(blocked_markets_count_stmt) or 0)

    blocked_agg = (
        select(
            Comment.market_id.label("market_id"),
            func.count().label("blocked_comments"),
        )
        .where(Comment.status == "blocked")
        .group_by(Comment.market_id)
        .subquery()
    )
    disputed_stmt = (
        select(
            Market.id,
            Market.question,
            blocked_agg.c.blocked_comments,
        )
        .join(blocked_agg, Market.id == blocked_agg.c.market_id)
        .order_by(blocked_agg.c.blocked_comments.desc())
        .limit(50)
    )
    disputed_rows = (await session.execute(disputed_stmt)).mappings().all()
    disputed_markets = [
        {
            "market_id": int(r["id"]),
            "question": r["question"],
            "blocked_comments": int(r["blocked_comments"] or 0),
        }
        for r in disputed_rows
    ]

    c7 = (
        select(
            Comment.market_id.label("market_id"),
            func.count().label("comment_count_7d"),
        )
        .where(
            Comment.status == "active",
            Comment.created_at >= seven_ago,
        )
        .group_by(Comment.market_id)
        .having(func.count() >= HIGH_COMMENT_WEEK_THRESHOLD)
        .subquery()
    )
    hi_stmt = (
        select(Market.id, Market.question, c7.c.comment_count_7d)
        .join(c7, Market.id == c7.c.market_id)
        .order_by(c7.c.comment_count_7d.desc())
        .limit(40)
    )
    hi_rows = (await session.execute(hi_stmt)).mappings().all()
    high_comment_markets = [
        {
            "market_id": int(r["id"]),
            "question": r["question"],
            "active_comments_7d": int(r["comment_count_7d"] or 0),
        }
        for r in hi_rows
    ]

    dup_stmt = (
        select(
            User.pi_username,
            func.count().label("user_count"),
            func.array_agg(User.id).label("user_ids"),
        )
        .where(User.pi_username.isnot(None), func.trim(User.pi_username) != "")
        .group_by(User.pi_username)
        .having(func.count() > 1)
        .order_by(func.count().desc())
        .limit(40)
    )
    dup_rows = (await session.execute(dup_stmt)).mappings().all()
    duplicate_pi_usernames: List[dict[str, Any]] = []
    for r in dup_rows:
        raw_ids = r.get("user_ids") or []
        if not isinstance(raw_ids, list):
            raw_ids = list(raw_ids) if raw_ids is not None else []
        duplicate_pi_usernames.append(
            {
                "pi_username": r["pi_username"],
                "user_count": int(r["user_count"] or 0),
                "user_ids": [int(x) for x in raw_ids],
            }
        )

    lt_stmt = (
        select(
            MarketTrade.id,
            MarketTrade.created_at,
            MarketTrade.market_id,
            MarketTrade.taker_user_id,
            MarketTrade.pi_total_amount,
            MarketTrade.side,
            MarketTrade.outcome,
            Market.question.label("market_question"),
        )
        .join(Market, Market.id == MarketTrade.market_id)
        .where(
            MarketTrade.created_at >= seven_ago,
            MarketTrade.pi_total_amount >= LARGE_TRADE_PI_THRESHOLD,
        )
        .order_by(MarketTrade.pi_total_amount.desc())
        .limit(40)
    )
    lt_rows = (await session.execute(lt_stmt)).mappings().all()
    large_trades_7d = [
        {
            "trade_id": int(r["id"]),
            "created_at": r["created_at"],
            "market_id": int(r["market_id"]),
            "market_question": r["market_question"],
            "taker_user_id": int(r["taker_user_id"]),
            "pi_total_amount": float(r["pi_total_amount"] or 0),
            "side": r["side"],
            "outcome": r["outcome"],
        }
        for r in lt_rows
    ]

    unresolved_edge_stmt = (
        select(
            Market.id,
            Market.question,
            Market.status,
            Market.edge_cases,
            Market.updated_at,
        )
        .where(
            Market.edge_cases.isnot(None),
            func.trim(Market.edge_cases) != "",
            func.coalesce(Market.is_resolved, False) == False,
        )
        .order_by(Market.updated_at.desc().nullslast())
        .limit(50)
    )
    edge_rows = (await session.execute(unresolved_edge_stmt)).mappings().all()
    unresolved_edge_case_markets = [dict(r) for r in edge_rows]

    manual_stmt = (
        select(
            Market.id,
            Market.question,
            Market.resolved_outcome,
            Market.resolved_at,
            Market.resolved_by_username,
            Market.resolved_by_user_id,
        )
        .where(
            func.coalesce(Market.is_resolved, False) == True,
            Market.resolved_by_username.isnot(None),
        )
        .order_by(Market.resolved_at.desc().nullslast())
        .limit(40)
    )
    manual_rows = (await session.execute(manual_stmt)).mappings().all()
    manual_admin_resolutions = [dict(r) for r in manual_rows]

    return {
        "generated_at": now,
        "thresholds": {
            "high_comment_count_7d": HIGH_COMMENT_WEEK_THRESHOLD,
            "large_trade_pi_7d": float(LARGE_TRADE_PI_THRESHOLD),
        },
        "suspicious_signals": {
            "payment_amount_mismatches": payment_mismatch_count,
            "failed_payments_last_7d": failed_payments_7d,
            "markets_with_blocked_comments": markets_with_blocked_comments,
            "duplicate_pi_username_groups": len(duplicate_pi_usernames),
            "scope_note": "Roll-up of automated checks; confirm before action.",
        },
        "disputed_markets": {
            "scope_note": "Markets with at least one blocked (moderated) comment — review for disputes.",
            "count": markets_with_blocked_comments,
            "items": disputed_markets,
        },
        "markets_high_comment_activity": {
            "scope_note": f"Active comments in the last 7 days (≥ {HIGH_COMMENT_WEEK_THRESHOLD} per market).",
            "count": len(high_comment_markets),
            "items": high_comment_markets,
        },
        "duplicate_pi_usernames": {
            "scope_note": "Pi usernames shared by more than one user row — data integrity risk.",
            "count": len(duplicate_pi_usernames),
            "items": duplicate_pi_usernames,
        },
        "large_sudden_trades": {
            "scope_note": f"Largest fills in the last 7 days with π total ≥ {float(LARGE_TRADE_PI_THRESHOLD)}.",
            "count": len(large_trades_7d),
            "items": large_trades_7d,
        },
        "unresolved_edge_cases": {
            "scope_note": "Unresolved markets with non-empty edge-case notes in market copy.",
            "count": len(unresolved_edge_case_markets),
            "items": unresolved_edge_case_markets,
        },
        "manual_admin_overrides": {
            "scope_note": "Recent admin resolutions (resolver recorded on the market).",
            "count": len(manual_admin_resolutions),
            "items": manual_admin_resolutions,
        },
    }

from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import aliased

from app.core.logger import get_logger
from app.models.tables.category import Category
from app.models.tables.leaderboard import Leaderboard
from app.models.tables.market import Market
from app.models.tables.market_token import MarketToken
from app.models.tables.market_trades import MarketTrade
from app.models.tables.user import User

logger = get_logger()
LEADERBOARD_REFRESH_INTERVAL_SECONDS = 60 * 60
_QUANT = Decimal("0.0001")


def _bucket_starts(now: datetime) -> dict[str, Optional[datetime]]:
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = day_start - timedelta(days=day_start.weekday())
    month_start = day_start.replace(day=1)
    return {
        "1D": day_start,
        "1W": week_start,
        "1M": month_start,
        "ALL": None,
    }


def _safe_decimal(value: Decimal | None) -> Decimal:
    return value if value is not None else Decimal("0")


def _build_position_stats(
    trades: list[tuple[int, int, str, str, Decimal, Decimal]]
) -> dict[tuple[int, int], dict[str, Decimal]]:
    stats: dict[tuple[int, int], dict[str, Decimal]] = defaultdict(
        lambda: {
            "yes_shares": Decimal("0"),
            "no_shares": Decimal("0"),
            "yes_pi_amount": Decimal("0"),
            "no_pi_amount": Decimal("0"),
        }
    )
    for user_id, market_id, side, outcome, shares, pi_amount in trades:
        key = (market_id, user_id)
        share_sign = Decimal("1") if side == "BUY" else Decimal("-1")
        amount_sign = Decimal("1") if side == "BUY" else Decimal("-1")
        if outcome == "YES":
            stats[key]["yes_shares"] += shares * share_sign
            stats[key]["yes_pi_amount"] += pi_amount * amount_sign
        elif outcome == "NO":
            stats[key]["no_shares"] += shares * share_sign
            stats[key]["no_pi_amount"] += pi_amount * amount_sign
    return stats


async def _load_trade_rows(
    session: AsyncSession,
    *,
    since: Optional[datetime],
) -> list[tuple[int, int, str, str, Decimal, Decimal]]:
    stmt = select(
        MarketTrade.taker_user_id,
        MarketTrade.market_id,
        MarketTrade.side,
        MarketTrade.outcome,
        MarketTrade.shares,
        MarketTrade.pi_amount,
    )
    if since is not None:
        stmt = stmt.where(MarketTrade.created_at >= since)
    result = await session.execute(stmt)
    return [
        (
            user_id,
            market_id,
            side,
            outcome,
            _safe_decimal(shares),
            _safe_decimal(pi_amount),
        )
        for user_id, market_id, side, outcome, shares, pi_amount in result.all()
    ]


async def rebuild_leaderboards(session: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    bucket_starts = _bucket_starts(now)

    yes_token = aliased(MarketToken)
    no_token = aliased(MarketToken)
    market_result = await session.execute(
        select(Market.id, Category.name, yes_token.price, no_token.price)
        .outerjoin(Category, Market.category_id == Category.id)
        .outerjoin(
            yes_token,
            and_(yes_token.market_id == Market.id, yes_token.outcome == "YES"),
        )
        .outerjoin(
            no_token,
            and_(no_token.market_id == Market.id, no_token.outcome == "NO"),
        )
    )
    market_map = {
        market_id: {
            "category": category_name or "Unknown",
            "yes_price": _safe_decimal(outcome_price_yes),
            "no_price": _safe_decimal(outcome_price_no),
        }
        for market_id, category_name, outcome_price_yes, outcome_price_no in market_result.all()
    }

    user_result = await session.execute(select(User.id, User.pi_uid, User.pi_username))
    user_map = {
        user_id: {"pi_uid": pi_uid, "pi_username": pi_username}
        for user_id, pi_uid, pi_username in user_result.all()
    }

    rows_to_insert: list[Leaderboard] = []
    leaderboard_id = 1

    for bucket, since in bucket_starts.items():
        trades = await _load_trade_rows(session, since=since)
        if not trades:
            continue

        vol_by_user_category: dict[tuple[int, str], Decimal] = defaultdict(lambda: Decimal("0"))
        for user_id, market_id, *_rest, pi_amount in trades:
            market_info = market_map.get(market_id)
            if market_info is None:
                continue
            category = market_info["category"]
            vol_by_user_category[(user_id, category)] += pi_amount

        position_stats = _build_position_stats(trades)
        pnl_by_user_category: dict[tuple[int, str], Decimal] = defaultdict(lambda: Decimal("0"))
        for (market_id, user_id), stat in position_stats.items():
            market_info = market_map.get(market_id)
            if market_info is None:
                continue
            category = market_info["category"]
            yes_shares = max(stat["yes_shares"], Decimal("0"))
            no_shares = max(stat["no_shares"], Decimal("0"))
            yes_pi_amount = max(stat["yes_pi_amount"], Decimal("0"))
            no_pi_amount = max(stat["no_pi_amount"], Decimal("0"))
            mark_value = (yes_shares * market_info["yes_price"]) + (no_shares * market_info["no_price"])
            cost_basis = yes_pi_amount + no_pi_amount
            pnl_by_user_category[(user_id, category)] += mark_value - cost_basis

        all_keys = set(vol_by_user_category.keys()) | set(pnl_by_user_category.keys())
        sorted_keys = sorted(
            all_keys,
            key=lambda key: (
                vol_by_user_category.get(key, Decimal("0")),
                pnl_by_user_category.get(key, Decimal("0")),
            ),
            reverse=True,
        )

        for user_id, category in sorted_keys:
            user_info = user_map.get(user_id)
            if user_info is None:
                continue
            rows_to_insert.append(
                Leaderboard(
                    id=leaderboard_id,
                    category=category,
                    time_bucket=bucket,
                    user_id=user_id,
                    pi_user_id=user_info["pi_uid"],
                    pi_username=user_info["pi_username"],
                    wallet_address=None,
                    vol=vol_by_user_category.get((user_id, category), Decimal("0")).quantize(_QUANT),
                    pnl=pnl_by_user_category.get((user_id, category), Decimal("0")).quantize(_QUANT),
                    created_at=now,
                    updated_at=now,
                )
            )
            leaderboard_id += 1

        # Add synthetic "All" category rows (one row per user).
        vol_by_user_all: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
        for (user_id, _category), vol in vol_by_user_category.items():
            vol_by_user_all[user_id] += vol

        pnl_by_user_all: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
        for (user_id, _category), pnl in pnl_by_user_category.items():
            pnl_by_user_all[user_id] += pnl

        all_user_ids = set(vol_by_user_all.keys()) | set(pnl_by_user_all.keys())
        sorted_user_ids = sorted(
            all_user_ids,
            key=lambda user_id: (
                vol_by_user_all.get(user_id, Decimal("0")),
                pnl_by_user_all.get(user_id, Decimal("0")),
            ),
            reverse=True,
        )

        for user_id in sorted_user_ids:
            user_info = user_map.get(user_id)
            if user_info is None:
                continue
            rows_to_insert.append(
                Leaderboard(
                    id=leaderboard_id,
                    category="All",
                    time_bucket=bucket,
                    user_id=user_id,
                    pi_user_id=user_info["pi_uid"],
                    pi_username=user_info["pi_username"],
                    wallet_address=None,
                    vol=vol_by_user_all.get(user_id, Decimal("0")).quantize(_QUANT),
                    pnl=pnl_by_user_all.get(user_id, Decimal("0")).quantize(_QUANT),
                    created_at=now,
                    updated_at=now,
                )
            )
            leaderboard_id += 1

    await session.execute(delete(Leaderboard))
    if rows_to_insert:
        session.add_all(rows_to_insert)
    await session.commit()
    return len(rows_to_insert)


async def refresh_leaderboards_once(session_maker: async_sessionmaker[AsyncSession]) -> None:
    async with session_maker() as session:
        try:
            row_count = await rebuild_leaderboards(session)
            logger.info("Leaderboard refreshed (%s rows)", row_count)
        except Exception:
            await session.rollback()
            logger.exception("Failed to refresh leaderboard")


async def run_periodic_leaderboard_refresh(
    session_maker: async_sessionmaker[AsyncSession],
    interval_seconds: int = LEADERBOARD_REFRESH_INTERVAL_SECONDS,
) -> None:
    await refresh_leaderboards_once(session_maker)
    while True:
        await asyncio.sleep(interval_seconds)
        await refresh_leaderboards_once(session_maker)

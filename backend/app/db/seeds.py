"""Idempotent dev/demo seed rows."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random
import time

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.market import insert_market_trade, update_market_position, update_market_price
from app.db.config import (
    SEED_ADMIN_USERS,
    SEED_CATEGORY_ROWS,
    SEED_COMMENT_BODY_REPLY_TEMPLATES,
    SEED_COMMENT_BODY_ROOT_TEMPLATES,
    SEED_COMMENT_REPLY_PER_ROOT_MAX,
    SEED_COMMENT_REPLY_PER_ROOT_MIN,
    SEED_COMMENT_ROOT_PER_MARKET_MAX,
    SEED_COMMENT_ROOT_PER_MARKET_MIN,
    SEED_DECIMAL_QUANT,
    SEED_DECIMAL_ZERO,
    SEED_DECIMAL_ZERO_QUANT,
    SEED_INITIAL_USER_BALANCE,
    SEED_MARKET_COUNT,
    SEED_MARKET_DEFAULT_PRICE,
    SEED_MARKET_DEFAULT_VOLUME,
    SEED_MARKET_DESCRIPTION,
    SEED_MARKET_END_MAX_DAYS_AHEAD,
    SEED_MARKET_END_MIN_DAYS_AHEAD,
    SEED_MARKET_FIRST_ID,
    SEED_MARKET_ICON_TEMPLATE,
    SEED_MARKET_LIQUIDITY_MAX,
    SEED_MARKET_LIQUIDITY_MIN,
    SEED_MARKET_MAX_CATEGORY_ID,
    SEED_MARKET_MIN_CATEGORY_ID,
    SEED_MARKET_PERIODS,
    SEED_MARKET_PREDICATES,
    SEED_MARKET_RULE_TEMPLATE,
    SEED_MARKET_START_MAX_DAYS_AGO,
    SEED_MARKET_START_MIN_DAYS_AGO,
    SEED_MARKET_STATUS,
    SEED_MARKET_SUBJECTS,
    SEED_MARKET_TARGETS,
    SEED_MARKET_TIER,
    SEED_MARKET_VOLUME_AGG_STATE_ID,
    SEED_MARKET_VOLUME_AGG_STATE_LAST_TRADE_ID,
    SEED_MARKET_VOLUME_AGG_STATE_LAST_VOLUME_1M_ID,
    SEED_OUTCOMES,
    SEED_OUTCOME_NO,
    SEED_OUTCOME_YES,
    SEED_SUGGESTION_CATEGORY_SLUGS,
    SEED_SUGGESTION_COUNT,
    SEED_SUGGESTION_DESCRIPTION,
    SEED_SUGGESTION_DURATION_MAX_DAYS,
    SEED_SUGGESTION_DURATION_MIN_DAYS,
    SEED_SUGGESTION_FIRST_ID,
    SEED_SUGGESTION_QUESTION_TEMPLATES,
    SEED_SUGGESTION_START_MAX_DAYS_AHEAD,
    SEED_SUGGESTION_START_MIN_DAYS_AHEAD,
    SEED_SUGGESTION_STATUS,
    SEED_SUGGESTION_TOPICS,
    SEED_SUGGESTION_USER_MAX_ID,
    SEED_SUGGESTION_USER_MIN_ID,
    SEED_SUGGESTION_WINDOWS,
    SEED_TABLES,
    SEED_TRADE_COUNT_MAX_PER_DAY,
    SEED_TRADE_COUNT_MIN_PER_DAY,
    SEED_TRADE_LOOKBACK_DAYS,
    SEED_TRADE_SECOND_MAX,
    SEED_TRADE_SECOND_MIN,
    SEED_TRADE_SHARES_MAX,
    SEED_TRADE_SHARES_MIN,
    SEED_USER_COUNT,
    SEED_USER_DEFAULT_BALANCE,
    SEED_USER_FIRST_ID,
    SEED_USER_NOUN_POOL,
    SEED_USER_ROLE_ID,
    SEED_USER_STATUS_POOL,
    SEED_USER_SUFFIX_MAX,
    SEED_USER_SUFFIX_MIN,
)
from app.utils import generate_bigint_64

from app.models.tables.category import Category
from app.models.tables.comment import Comment
from app.models.tables.comment_stat import CommentStat
from app.models.tables.market import Market
from app.models.tables.market_token import MarketToken
from app.models.tables.user import User
from app.models.tables.market_trades import MarketTrade
from app.models.tables.market_price_candles import MarketPriceCandle
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_volume_agg_state import MarketVolumeAggState
from app.models.tables.suggestion import Suggestion
from app.updator import leaderboard_updater, market_stats_updator
from app.updator import market_price_candle_updater


async def _ensure_user(session: AsyncSession, **kwargs: object) -> None:
    session.add(User(**kwargs))


async def _ensure_category(session: AsyncSession, **kwargs: object) -> None:
    session.add(Category(**kwargs))


async def _ensure_market(session: AsyncSession, **kwargs: object) -> None:
    session.add(Market(**kwargs))


async def _ensure_market_token(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketToken(**kwargs))


async def _ensure_market_price_candle(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketPriceCandle(**kwargs))


async def _ensure_market_position(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketPosition(**kwargs))


async def _ensure_suggestion(session: AsyncSession, **kwargs: object) -> None:
    session.add(Suggestion(**kwargs))


async def _ensure_market_volume_agg_state(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketVolumeAggState(**kwargs))


async def _ensure_comment(session: AsyncSession, **kwargs: object) -> None:
    session.add(Comment(**kwargs))


async def _ensure_comment_stat(session: AsyncSession, **kwargs: object) -> None:
    session.add(CommentStat(**kwargs))


async def _sync_table_sequence(session: AsyncSession, table_name: str, id_column: str = "id") -> None:
    await session.execute(
        text(
            f"""
            WITH seq AS (
                SELECT pg_get_serial_sequence('{table_name}', '{id_column}') AS seq_name
            )
            SELECT setval(
                seq.seq_name,
                COALESCE((SELECT MAX({id_column}) FROM {table_name}), 0) + 1,
                false
            )
            FROM seq
            WHERE seq.seq_name IS NOT NULL
            """
        )
    )


async def _sync_seed_sequences(session: AsyncSession) -> None:
    for table_name in SEED_TABLES:
        await _sync_table_sequence(session, table_name)


async def _ensure_comment_partitions(session: AsyncSession) -> None:
    await session.execute(
        text(
            """
            DO $body$
            DECLARE
              curr_month_start date := date_trunc('month', now())::date;
              next_month_start date := (date_trunc('month', now()) + interval '1 month')::date;
              next2_month_start date := (date_trunc('month', now()) + interval '2 month')::date;
            BEGIN
              IF EXISTS (
                SELECT 1
                FROM pg_partitioned_table p
                JOIN pg_class c ON c.oid = p.partrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = 'comments'
                  AND n.nspname = current_schema()
              ) THEN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_class c
                  JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE c.relname = 'comments_default'
                    AND n.nspname = current_schema()
                ) THEN
                  EXECUTE 'CREATE TABLE comments_default PARTITION OF comments DEFAULT';
                END IF;

                IF NOT EXISTS (
                  SELECT 1 FROM pg_class c
                  JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE c.relname = to_char(curr_month_start, '"comments_y"YYYY"m"MM')
                    AND n.nspname = current_schema()
                ) THEN
                  EXECUTE format(
                    'CREATE TABLE %I PARTITION OF comments FOR VALUES FROM (%L) TO (%L)',
                    to_char(curr_month_start, '"comments_y"YYYY"m"MM'),
                    curr_month_start,
                    next_month_start
                  );
                END IF;

                IF NOT EXISTS (
                  SELECT 1 FROM pg_class c
                  JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE c.relname = to_char(next_month_start, '"comments_y"YYYY"m"MM')
                    AND n.nspname = current_schema()
                ) THEN
                  EXECUTE format(
                    'CREATE TABLE %I PARTITION OF comments FOR VALUES FROM (%L) TO (%L)',
                    to_char(next_month_start, '"comments_y"YYYY"m"MM'),
                    next_month_start,
                    next2_month_start
                  );
                END IF;
              END IF;
            END
            $body$;
            """
        )
    )


async def run_seeds(session: AsyncSession) -> None:
    """Insert seed rows if missing."""
    await run_seed_categories(session)
    await session.flush()
    await run_seed_users(session)
    await session.flush()
    await run_seed_suggestions(session)
    await session.flush()
    await run_seed_markets(session)
    await session.flush()
    await _ensure_comment_partitions(session)
    await session.flush()
    await run_seed_comments(session)
    await session.flush()
    await run_seed_market_trades(session)
    await session.flush()
    await run_seed_market_volume_agg_state(session)
    await session.flush()
    await market_stats_updator.refresh_market_volume_1m(session, commit=False)
    await session.flush()
    await market_stats_updator.refresh_market_volume_1d(session, commit=False)
    await session.flush()
    await leaderboard_updater.rebuild_leaderboards(session, commit=False)
    await session.flush()
    await _sync_seed_sequences(session)
    await session.flush()


async def run_seed_categories(session: AsyncSession) -> None:
    now: datetime = datetime.now(timezone.utc)
    for category_id, slug, name in SEED_CATEGORY_ROWS:
        await _ensure_category(
            session,
            id=category_id,
            slug=slug,
            name=name,
            created_at=now,
        )


async def run_seed_users(session: AsyncSession) -> None:
    now: datetime = datetime.now(timezone.utc)
    for user_id, username, uid, role_id in SEED_ADMIN_USERS:
        await _ensure_user(
            session,
            id=user_id,
            pi_username=username,
            pi_uid=uid,
            role_id=role_id,
            balance=SEED_INITIAL_USER_BALANCE,
            status=SEED_USER_STATUS_POOL[0],
            created_at=now,
            updated_at=now,
        )

    for idx in range(SEED_USER_COUNT):
        user_id = SEED_USER_FIRST_ID + idx
        noun = random.choice(SEED_USER_NOUN_POOL)
        suffix = random.randint(SEED_USER_SUFFIX_MIN, SEED_USER_SUFFIX_MAX)
        username = f"seed_{noun}_{suffix}"
        uid = f"seed-user-{user_id}-{suffix}"
        balance = SEED_USER_DEFAULT_BALANCE

        await _ensure_user(
            session,
            id=user_id,
            pi_username=username,
            pi_uid=uid,
            role_id=SEED_USER_ROLE_ID,
            balance=balance,
            status=random.choice(SEED_USER_STATUS_POOL),
            created_at=now,
            updated_at=now,
        )


async def run_seed_markets(session: AsyncSession) -> None:
    r = await session.execute(select(User.id).where(User.role_id == 1))
    admin_id = r.scalar_one_or_none()
    if admin_id is None:
        return

    now: datetime = datetime.now(timezone.utc)
    used_slugs: set[str] = set()
    for idx in range(SEED_MARKET_COUNT):
        market_id = SEED_MARKET_FIRST_ID + idx
        subject = random.choice(SEED_MARKET_SUBJECTS)
        predicate = random.choice(SEED_MARKET_PREDICATES)
        target = random.choice(SEED_MARKET_TARGETS)
        period = random.choice(SEED_MARKET_PERIODS)

        question = f"Will {subject} {predicate} {target} {period}?"
        slug_base = question.lower().replace(" ", "-").replace("?", "").replace("&", "and").replace(".", "")
        slug = slug_base
        dedupe_seq = 2
        while slug in used_slugs:
            slug = f"{slug_base}-{dedupe_seq}"
            dedupe_seq += 1
        used_slugs.add(slug)

        start_date = (now - timedelta(days=random.randint(SEED_MARKET_START_MIN_DAYS_AGO, SEED_MARKET_START_MAX_DAYS_AGO))).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_date = (now + timedelta(days=random.randint(SEED_MARKET_END_MIN_DAYS_AHEAD, SEED_MARKET_END_MAX_DAYS_AHEAD))).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        yes_price = SEED_MARKET_DEFAULT_PRICE
        no_price = SEED_MARKET_DEFAULT_PRICE

        liquidity = Decimal(str(random.randint(SEED_MARKET_LIQUIDITY_MIN, SEED_MARKET_LIQUIDITY_MAX)))
        volume = SEED_MARKET_DEFAULT_VOLUME
        resolution_time = end_date + timedelta(hours=random.randint(6, 48))

        yes_criteria = (
            f"Resolved YES if credible reporting confirms that {subject} {predicate} {target} {period} "
            f"by the market close time."
        )
        no_criteria = (
            f"Resolved NO if credible reporting confirms that the YES condition did not occur "
            f"by the market close time."
        )
        edge_cases = (
            "If the event is delayed, the market may remain pending until an official update is available. "
            "If official sources conflict or the outcome remains ambiguous for an extended period, admin may "
            "resolve using the most authoritative source listed in Resolution Source."
        )
        market_context = (
            f"This market tracks whether {subject} {predicate} {target} {period}. "
            "This context is informational only and does not suggest a YES or NO position."
        )
        resolution_source = (
            "Official organizer announcement, government/public data releases, and widely recognized news wires."
        )

        await _ensure_market(
            session,
            id=market_id,
            question=question,
            slug=slug,
            description=SEED_MARKET_DESCRIPTION,
            icon=SEED_MARKET_ICON_TEMPLATE.format(market_id=market_id),
            category_id=random.randint(SEED_MARKET_MIN_CATEGORY_ID, SEED_MARKET_MAX_CATEGORY_ID),
            creator_id=admin_id,
            tier=SEED_MARKET_TIER,
            start_date=start_date,
            end_date=end_date,
            liquidity=liquidity,
            volume=volume,
            status=SEED_MARKET_STATUS,
            is_active=True,
            is_closed=False,
            is_archived=False,
            is_resolved=False,
            rules=SEED_MARKET_RULE_TEMPLATE,
            yes_criteria=yes_criteria,
            no_criteria=no_criteria,
            edge_cases=edge_cases,
            market_context=market_context,
            resolution_source=resolution_source,
            resolution_time=resolution_time,
            created_at=start_date,
            updated_at=start_date,
        )
        await _ensure_market_token(
            session,
            market_id=market_id,
            outcome=SEED_OUTCOME_YES,
            token=str(generate_bigint_64()),
            price=yes_price,
        )
        await _ensure_market_token(
            session,
            market_id=market_id,
            outcome=SEED_OUTCOME_NO,
            token=str(generate_bigint_64()),
            price=no_price,
        )


async def run_seed_suggestions(session: AsyncSession) -> None:
    now: datetime = datetime.now(timezone.utc)
    for idx in range(SEED_SUGGESTION_COUNT):
        suggestion_id = SEED_SUGGESTION_FIRST_ID + idx
        start_date = (now + timedelta(days=random.randint(SEED_SUGGESTION_START_MIN_DAYS_AHEAD, SEED_SUGGESTION_START_MAX_DAYS_AHEAD))).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_date = (start_date + timedelta(days=random.randint(SEED_SUGGESTION_DURATION_MIN_DAYS, SEED_SUGGESTION_DURATION_MAX_DAYS))).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        question = random.choice(SEED_SUGGESTION_QUESTION_TEMPLATES).format(
            topic=random.choice(SEED_SUGGESTION_TOPICS),
            window=random.choice(SEED_SUGGESTION_WINDOWS),
        )

        await _ensure_suggestion(
            session,
            id=suggestion_id,
            user_id=random.randint(SEED_SUGGESTION_USER_MIN_ID, SEED_SUGGESTION_USER_MAX_ID),
            question=question,
            description=SEED_SUGGESTION_DESCRIPTION,
            category=random.choice(SEED_SUGGESTION_CATEGORY_SLUGS),
            start_date=start_date,
            end_date=end_date,
            status=SEED_SUGGESTION_STATUS,
            reject_reason=None,
            reviewed_by=None,
            reviewed_at=None,
            created_at=now,
            updated_at=now,
        )


async def run_seed_market_trades(session: AsyncSession) -> None:
    started_at = time.perf_counter()
    inserted_trade_count = 0

    token_rows = await session.execute(
        select(
            MarketToken.market_id,
            MarketToken.outcome,
        )
    )
    user_rows = await session.execute(select(User.id))
    market_outcomes: dict[int, set[str]] = defaultdict(set)
    for market_id, outcome in token_rows.all():
        if outcome in SEED_OUTCOMES:
            market_outcomes[market_id].add(outcome)
    market_ids = [
        market_id
        for market_id, outcomes in market_outcomes.items()
        if SEED_OUTCOME_YES in outcomes and SEED_OUTCOME_NO in outcomes
    ]
    if not market_ids:
        elapsed_seconds = time.perf_counter() - started_at
        print(
            f"run_seed_market_trades skipped: no markets found "
            f"(inserted=0, elapsed={elapsed_seconds:.2f}s)"
        )
        return

    user_ids = [user_id for (user_id,) in user_rows.all()]
    if not user_ids:
        elapsed_seconds = time.perf_counter() - started_at
        print(
            f"run_seed_market_trades skipped: no users found "
            f"(inserted=0, elapsed={elapsed_seconds:.2f}s)"
        )
        return

    now = datetime.now(timezone.utc)
    start_day = (now - timedelta(days=SEED_TRADE_LOOKBACK_DAYS)).date()
    end_day = now.date()
    total_days = (end_day - start_day).days + 1

    for day_index in range(total_days):
        day = start_day + timedelta(days=day_index)
        day_start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
        trade_count = random.randint(SEED_TRADE_COUNT_MIN_PER_DAY, SEED_TRADE_COUNT_MAX_PER_DAY)
        seconds = sorted(
            random.randint(SEED_TRADE_SECOND_MIN, SEED_TRADE_SECOND_MAX) for _ in range(trade_count)
        )

        for second_of_day in seconds:
            created_at = day_start + timedelta(seconds=second_of_day)
            market_id = random.choice(market_ids)
            outcome = random.choice(SEED_OUTCOMES)
            shares = Decimal(str(random.randint(SEED_TRADE_SHARES_MIN, SEED_TRADE_SHARES_MAX)))

            taker_user_id = random.choice(user_ids)
            trade = await insert_market_trade(
                session=session,
                user_id=taker_user_id,
                market_id=market_id,
                outcome=outcome,
                shares=shares,
                created_at=created_at,
            )
            await update_market_price(session, trade)
            await update_market_position(session, trade)
            await market_price_candle_updater.refresh_market_price_candles_once(session, created_at)
            inserted_trade_count += 1

    elapsed_seconds = time.perf_counter() - started_at
    print(
        f"run_seed_market_trades completed: inserted={inserted_trade_count}, "
        f"elapsed={elapsed_seconds:.2f}s"
    )


async def run_seed_market_price_candles(session: AsyncSession) -> None:
    trades_result = await session.execute(
        select(
            MarketTrade.market_id,
            MarketTrade.outcome,
            MarketTrade.price,
            MarketTrade.shares,
            MarketTrade.created_at,
        ).order_by(MarketTrade.market_id, MarketTrade.outcome, MarketTrade.created_at)
    )
    trades = trades_result.all()
    if not trades:
        print("No market trades found for candle seeding")
        return

    market_ids = sorted({market_id for market_id, *_ in trades})
    market_result = await session.execute(
        select(MarketToken.market_id, MarketToken.outcome, MarketToken.token).where(
            MarketToken.market_id.in_(market_ids)
        )
    )
    market_token_map: dict[int, dict[str, str]] = defaultdict(dict)
    for market_id, outcome, token in market_result.all():
        market_token_map[market_id][outcome] = token

    buckets: dict[tuple[int, str, int], list[tuple[datetime, Decimal, Decimal]]] = defaultdict(list)
    for market_id, outcome, price, shares, created_at in trades:
        if outcome not in SEED_OUTCOMES:
            continue
        token_map = market_token_map.get(market_id)
        if token_map is None or not token_map.get(outcome):
            continue
        minute_ts = int(created_at.timestamp()) // 60 * 60
        buckets[(market_id, outcome, minute_ts)].append((created_at, price, shares))

    quant = SEED_DECIMAL_QUANT
    for (market_id, outcome, ts), rows in sorted(buckets.items()):
        rows.sort(key=lambda row: row[0])
        prices = [row[1] for row in rows]
        open_price = rows[0][1].quantize(quant)
        close_price = rows[-1][1].quantize(quant)
        high_price = max(prices).quantize(quant)
        low_price = min(prices).quantize(quant)
        volume = sum((row[2] for row in rows), SEED_DECIMAL_ZERO).quantize(quant)
        token = market_token_map[market_id][outcome]
        if token is None:
            continue

        await _ensure_market_price_candle(
            session,
            market_id=market_id,
            token=token,
            ts=ts,
            open_price=open_price,
            high_price=high_price,
            low_price=low_price,
            close_price=close_price,
            volume=volume,
        )


def _build_position_stats(
    trades: list[tuple[int, int, str, str, str, Decimal, Decimal]]
) -> dict[tuple[int, int], dict[str, Decimal]]:
    stats: dict[tuple[int, int], dict[str, Decimal]] = defaultdict(
        lambda: {
            "shares": SEED_DECIMAL_ZERO,
            "pi_amount": SEED_DECIMAL_ZERO,
        }
    )
    for user_id, market_id, token, side, outcome, shares, pi_amount in trades:
        key = (market_id, user_id, outcome)
        stats[key]["token"] = token
        stats[key]["side"] = side
        stats[key]["shares"] += shares
        stats[key]["pi_amount"] += pi_amount
    return stats


async def run_seed_market_positions(session: AsyncSession) -> None:
    trades_result = await session.execute(
        select(
            MarketTrade.taker_user_id,
            MarketTrade.market_id,
            MarketTrade.token,
            MarketTrade.side,
            MarketTrade.outcome,
            MarketTrade.shares,
            MarketTrade.pi_amount,
        )
    )
    trades = trades_result.all()
    if not trades:
        print("No market trades found for position seeding")
        return

    position_stats = _build_position_stats(trades)
    now: datetime = datetime.now(timezone.utc)
    quant = SEED_DECIMAL_QUANT

    for (market_id, user_id, outcome), stat in sorted(position_stats.items()):
        token = stat["token"]
        side = stat["side"]
        shares = max(stat["shares"], SEED_DECIMAL_ZERO).quantize(quant)
        pi_amount = max(stat["pi_amount"], SEED_DECIMAL_ZERO).quantize(quant)
        avg_price = (pi_amount / shares).quantize(quant) if shares > 0 else SEED_DECIMAL_ZERO_QUANT

        await _ensure_market_position(
            session,
            market_id=market_id,
            user_id=user_id,
            token=token,
            side=side,
            outcome=outcome,
            shares=shares,
            pi_amount=pi_amount,
            avg_price=avg_price,
            final_price=None,
            is_claimed=False,
            created_at=now,
            updated_at=now,
        )


async def run_seed_market_volume_agg_state(session: AsyncSession) -> None:
    await _ensure_market_volume_agg_state(
        session,
        id=SEED_MARKET_VOLUME_AGG_STATE_ID,
        last_trade_id=SEED_MARKET_VOLUME_AGG_STATE_LAST_TRADE_ID,
        last_volume_1m_id=SEED_MARKET_VOLUME_AGG_STATE_LAST_VOLUME_1M_ID,
    )


async def run_seed_comments(session: AsyncSession) -> None:
    market_rows = await session.execute(select(Market.id))
    markets = [row[0] for row in market_rows.all()]
    if not markets:
        return

    user_rows = await session.execute(select(User.id))
    user_ids = [row[0] for row in user_rows.all()]
    if not user_ids:
        return

    now: datetime = datetime.now(timezone.utc)
    for market_id in markets:
        root_count = random.randint(
            SEED_COMMENT_ROOT_PER_MARKET_MIN,
            SEED_COMMENT_ROOT_PER_MARKET_MAX,
        )
        total_reply_count = 0
        for idx in range(root_count):
            root_created_at = now - timedelta(minutes=(idx + 1) * random.randint(5, 50))
            root_comment = Comment(
                market_id=market_id,
                player_id=random.choice(user_ids),
                parent_comment_id=None,
                root_comment_id=None,
                depth=0,
                body=random.choice(SEED_COMMENT_BODY_ROOT_TEMPLATES),
                status="active",
                reply_count=0,
                created_at=root_created_at,
                updated_at=root_created_at,
            )
            session.add(root_comment)
            await session.flush()

            root_comment.root_comment_id = root_comment.id
            reply_count = random.randint(
                SEED_COMMENT_REPLY_PER_ROOT_MIN,
                SEED_COMMENT_REPLY_PER_ROOT_MAX,
            )
            root_comment.reply_count = reply_count
            total_reply_count += reply_count
            await session.flush()

            for ridx in range(reply_count):
                reply_created_at = root_created_at + timedelta(minutes=ridx + 1)
                await _ensure_comment(
                    session,
                    market_id=market_id,
                    player_id=random.choice(user_ids),
                    parent_comment_id=root_comment.id,
                    root_comment_id=root_comment.id,
                    depth=1,
                    body=random.choice(SEED_COMMENT_BODY_REPLY_TEMPLATES),
                    status="active",
                    reply_count=0,
                    created_at=reply_created_at,
                    updated_at=reply_created_at,
                )

        await _ensure_comment_stat(
            session,
            market_id=market_id,
            root_comment_count=root_count,
            reply_count=total_reply_count,
            last_commented_at=now,
        )




from __future__ import annotations

import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.logger import get_logger

logger = get_logger()
MARKET_VOLUME_1M_REFRESH_INTERVAL_SECONDS = 60
MARKET_VOLUME_1D_REFRESH_INTERVAL_SECONDS = 60 * 60
MARKET_STATS_24H_REFRESH_INTERVAL_SECONDS = 60
MARKET_STATS_EXTENDED_REFRESH_INTERVAL_SECONDS = 60 * 60
MARKET_DISCOVERY_REFRESH_INTERVAL_SECONDS = 60


async def refresh_market_volume_1m(session: AsyncSession, *, commit: bool = True) -> int:
    result = await session.execute(
        text(
            """
            WITH state AS (
              SELECT last_trade_id FROM market_volume_agg_state WHERE id = 1
            ),
            upper_bound AS (
              SELECT COALESCE(MAX(id), 0) AS max_trade_id FROM market_trades
            ),
            agg AS (
              SELECT
                t.market_id,
                date_trunc('minute', t.created_at) AS bucket_ts,
                SUM(pi_amount) AS volume,
                COUNT(*) AS trade_count
              FROM market_trades t, state s, upper_bound u
              WHERE t.id > s.last_trade_id
                AND t.id <= u.max_trade_id
              GROUP BY t.market_id, date_trunc('minute', t.created_at)
            ),
            upsert AS (
              INSERT INTO market_volume_1m (market_id, bucket_ts, volume, trade_count)
              SELECT market_id, bucket_ts, volume, trade_count
              FROM agg
              ON CONFLICT (market_id, bucket_ts)
              DO UPDATE SET
                volume = market_volume_1m.volume + EXCLUDED.volume,
                trade_count = market_volume_1m.trade_count + EXCLUDED.trade_count
              RETURNING 1
            )
            UPDATE market_volume_agg_state s
            SET last_trade_id = u.max_trade_id
            FROM upper_bound u
            WHERE s.id = 1
            """
        )
    )
    if commit:
        await session.commit()
    else:
        await session.flush()
    upserted_count = result.rowcount or 0
    logger.info("Market volume 1m refresh complete (rows=%s)", upserted_count)
    return upserted_count


async def refresh_market_volume_1d(session: AsyncSession, *, commit: bool = True) -> int:
    result = await session.execute(
        text(
            """
            WITH state AS (
              SELECT last_volume_1m_id FROM market_volume_agg_state WHERE id = 1
            ),
            upper_bound AS (
              SELECT COALESCE(MAX(id), 0) AS max_volume_1m_id FROM market_volume_1m
            ),
            agg AS (
              SELECT
                m.market_id,
                m.bucket_ts::date AS day,
                SUM(m.volume) AS volume,
                SUM(m.trade_count) AS trade_count
              FROM market_volume_1m m, state s, upper_bound u
              WHERE m.id > s.last_volume_1m_id
                AND m.id <= u.max_volume_1m_id
              GROUP BY m.market_id, m.bucket_ts::date
            ),
            upsert AS (
              INSERT INTO market_volume_1d (market_id, day, volume, trade_count)
              SELECT market_id, day, volume, trade_count
              FROM agg
              ON CONFLICT (market_id, day)
              DO UPDATE SET
                volume = market_volume_1d.volume + EXCLUDED.volume,
                trade_count = market_volume_1d.trade_count + EXCLUDED.trade_count,
                updated_at = now()
              RETURNING 1
            )
            UPDATE market_volume_agg_state s
            SET last_volume_1m_id = u.max_volume_1m_id
            FROM upper_bound u
            WHERE s.id = 1
            """
        )
    )
    if commit:
        await session.commit()
    else:
        await session.flush()
    upserted_count = result.rowcount or 0
    logger.info("Market volume 1d refresh complete (rows=%s)", upserted_count)
    return upserted_count


async def refresh_market_stats_24h(session: AsyncSession, *, commit: bool = True) -> int:
    result = await session.execute(
        text(
            """
            WITH agg AS (
              SELECT
                market_id,
                COALESCE(SUM(volume), 0) AS volume_24h,
                COALESCE(SUM(trade_count), 0) AS trades_24h
              FROM market_volume_1m
              WHERE bucket_ts > now() - interval '24 hours'
              GROUP BY market_id
            )
            INSERT INTO market_stats (
              market_id,
              volume_24h,
              volume_1w,
              volume_1m,
              volume_total,
              trades_24h,
              trades_total,
              trades_prev_24h,
              comments_24h,
              comments_prev_24h,
              activity_24h,
              activity_prev_24h,
              price_move_24h,
              trending_score,
              hot_score,
              updated_at
            )
            SELECT
              m.id AS market_id,
              COALESCE(a.volume_24h, 0) AS volume_24h,
              COALESCE(ms.volume_1w, 0) AS volume_1w,
              COALESCE(ms.volume_1m, 0) AS volume_1m,
              COALESCE(ms.volume_total, 0) AS volume_total,
              COALESCE(a.trades_24h, 0) AS trades_24h,
              COALESCE(ms.trades_total, 0) AS trades_total,
              COALESCE(ms.trades_prev_24h, 0) AS trades_prev_24h,
              COALESCE(ms.comments_24h, 0) AS comments_24h,
              COALESCE(ms.comments_prev_24h, 0) AS comments_prev_24h,
              COALESCE(ms.activity_24h, 0) AS activity_24h,
              COALESCE(ms.activity_prev_24h, 0) AS activity_prev_24h,
              COALESCE(ms.price_move_24h, 0) AS price_move_24h,
              COALESCE(ms.trending_score, 0) AS trending_score,
              COALESCE(ms.hot_score, 0) AS hot_score,
              now() AS updated_at
            FROM markets m
            LEFT JOIN agg a ON a.market_id = m.id
            LEFT JOIN market_stats ms ON ms.market_id = m.id
            ON CONFLICT (market_id)
            DO UPDATE SET
              volume_24h = EXCLUDED.volume_24h,
              trades_24h = EXCLUDED.trades_24h,
              updated_at = now()
            """
        )
    )
    if commit:
        await session.commit()
    else:
        await session.flush()
    updated_count = result.rowcount or 0
    logger.info("Market stats 24h refresh complete (rows=%s)", updated_count)
    return updated_count


async def refresh_market_stats_extended(session: AsyncSession, *, commit: bool = True) -> int:
    result = await session.execute(
        text(
            """
            WITH agg AS (
              SELECT
                market_id,
                COALESCE(
                  SUM(CASE WHEN day >= (CURRENT_DATE - interval '6 days')::date THEN volume ELSE 0 END),
                  0
                ) AS volume_1w,
                COALESCE(
                  SUM(CASE WHEN day >= (CURRENT_DATE - interval '29 days')::date THEN volume ELSE 0 END),
                  0
                ) AS volume_1m,
                COALESCE(SUM(volume), 0) AS volume_total,
                COALESCE(SUM(trade_count), 0) AS trades_total
              FROM market_volume_1d
              GROUP BY market_id
            )
            INSERT INTO market_stats (
              market_id,
              volume_24h,
              volume_1w,
              volume_1m,
              volume_total,
              trades_24h,
              trades_total,
              trades_prev_24h,
              comments_24h,
              comments_prev_24h,
              activity_24h,
              activity_prev_24h,
              price_move_24h,
              trending_score,
              hot_score,
              updated_at
            )
            SELECT
              m.id AS market_id,
              COALESCE(ms.volume_24h, 0) AS volume_24h,
              COALESCE(a.volume_1w, 0) AS volume_1w,
              COALESCE(a.volume_1m, 0) AS volume_1m,
              COALESCE(a.volume_total, 0) AS volume_total,
              COALESCE(ms.trades_24h, 0) AS trades_24h,
              COALESCE(a.trades_total, 0) AS trades_total,
              COALESCE(ms.trades_prev_24h, 0) AS trades_prev_24h,
              COALESCE(ms.comments_24h, 0) AS comments_24h,
              COALESCE(ms.comments_prev_24h, 0) AS comments_prev_24h,
              COALESCE(ms.activity_24h, 0) AS activity_24h,
              COALESCE(ms.activity_prev_24h, 0) AS activity_prev_24h,
              COALESCE(ms.price_move_24h, 0) AS price_move_24h,
              COALESCE(ms.trending_score, 0) AS trending_score,
              COALESCE(ms.hot_score, 0) AS hot_score,
              now() AS updated_at
            FROM markets m
            LEFT JOIN agg a ON a.market_id = m.id
            LEFT JOIN market_stats ms ON ms.market_id = m.id
            ON CONFLICT (market_id)
            DO UPDATE SET
              volume_1w = EXCLUDED.volume_1w,
              volume_1m = EXCLUDED.volume_1m,
              volume_total = EXCLUDED.volume_total,
              trades_total = EXCLUDED.trades_total,
              updated_at = now()
            """
        )
    )
    if commit:
        await session.commit()
    else:
        await session.flush()
    updated_count = result.rowcount or 0
    logger.info("Market stats extended refresh complete (rows=%s)", updated_count)
    return updated_count


async def refresh_market_discovery_stats(session: AsyncSession, *, commit: bool = True) -> int:
    result = await session.execute(
        text(
            """
            WITH
            trades_recent AS (
              SELECT market_id, COUNT(*)::int AS trades_24h
              FROM market_trades
              WHERE created_at >= now() - interval '24 hours'
              GROUP BY market_id
            ),
            trades_prev AS (
              SELECT market_id, COUNT(*)::int AS trades_prev_24h
              FROM market_trades
              WHERE created_at >= now() - interval '48 hours'
                AND created_at < now() - interval '24 hours'
              GROUP BY market_id
            ),
            comments_recent AS (
              SELECT market_id, COUNT(*)::int AS comments_24h
              FROM comments
              WHERE status = 'active'
                AND created_at >= now() - interval '24 hours'
              GROUP BY market_id
            ),
            comments_prev AS (
              SELECT market_id, COUNT(*)::int AS comments_prev_24h
              FROM comments
              WHERE status = 'active'
                AND created_at >= now() - interval '48 hours'
                AND created_at < now() - interval '24 hours'
              GROUP BY market_id
            ),
            price_move AS (
              SELECT
                market_id,
                COALESCE(MAX(price), 0) - COALESCE(MIN(price), 0) AS price_move_24h
              FROM market_trades
              WHERE created_at >= now() - interval '24 hours'
              GROUP BY market_id
            )
            INSERT INTO market_stats (
              market_id,
              volume_24h,
              volume_1w,
              volume_1m,
              volume_total,
              trades_24h,
              trades_total,
              trades_prev_24h,
              comments_24h,
              comments_prev_24h,
              activity_24h,
              activity_prev_24h,
              price_move_24h,
              trending_score,
              hot_score,
              updated_at
            )
            SELECT
              m.id AS market_id,
              COALESCE(ms.volume_24h, 0) AS volume_24h,
              COALESCE(ms.volume_1w, 0) AS volume_1w,
              COALESCE(ms.volume_1m, 0) AS volume_1m,
              COALESCE(ms.volume_total, 0) AS volume_total,
              COALESCE(tr.trades_24h, 0) AS trades_24h,
              COALESCE(ms.trades_total, 0) AS trades_total,
              COALESCE(tp.trades_prev_24h, 0) AS trades_prev_24h,
              COALESCE(cr.comments_24h, 0) AS comments_24h,
              COALESCE(cp.comments_prev_24h, 0) AS comments_prev_24h,
              (COALESCE(tr.trades_24h, 0) + COALESCE(cr.comments_24h, 0)) AS activity_24h,
              (COALESCE(tp.trades_prev_24h, 0) + COALESCE(cp.comments_prev_24h, 0)) AS activity_prev_24h,
              COALESCE(pm.price_move_24h, 0) AS price_move_24h,
              (
                ((COALESCE(tr.trades_24h, 0) + COALESCE(cr.comments_24h, 0))
                - (COALESCE(tp.trades_prev_24h, 0) + COALESCE(cp.comments_prev_24h, 0)))
                + ((COALESCE(tr.trades_24h, 0) + COALESCE(cr.comments_24h, 0)) * 0.5)
              )::numeric(18, 6) AS trending_score,
              (
                (COALESCE(m.volume, 0) * 0.1)
                + ((COALESCE(tr.trades_24h, 0) + COALESCE(cr.comments_24h, 0)) * 5)
                + (COALESCE(pm.price_move_24h, 0) * 100)
              )::numeric(18, 6) AS hot_score,
              now() AS updated_at
            FROM markets m
            LEFT JOIN market_stats ms ON ms.market_id = m.id
            LEFT JOIN trades_recent tr ON tr.market_id = m.id
            LEFT JOIN trades_prev tp ON tp.market_id = m.id
            LEFT JOIN comments_recent cr ON cr.market_id = m.id
            LEFT JOIN comments_prev cp ON cp.market_id = m.id
            LEFT JOIN price_move pm ON pm.market_id = m.id
            ON CONFLICT (market_id)
            DO UPDATE SET
              trades_24h = EXCLUDED.trades_24h,
              trades_prev_24h = EXCLUDED.trades_prev_24h,
              comments_24h = EXCLUDED.comments_24h,
              comments_prev_24h = EXCLUDED.comments_prev_24h,
              activity_24h = EXCLUDED.activity_24h,
              activity_prev_24h = EXCLUDED.activity_prev_24h,
              price_move_24h = EXCLUDED.price_move_24h,
              trending_score = EXCLUDED.trending_score,
              hot_score = EXCLUDED.hot_score,
              updated_at = now()
            """
        )
    )
    if commit:
        await session.commit()
    else:
        await session.flush()
    updated_count = result.rowcount or 0
    logger.info("Market discovery stats refresh complete (rows=%s)", updated_count)
    return updated_count


async def refresh_market_volume_1m_once(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    async with session_maker() as session:
        try:
            row_count = await refresh_market_volume_1m(session, commit=True)
            logger.info("Market volume refresh complete (rows=%s)", row_count)
        except Exception:
            await session.rollback()
            logger.exception("Failed to refresh market volume 1m")


async def refresh_market_volume_1d_once(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    async with session_maker() as session:
        try:
            row_count = await refresh_market_volume_1d(session, commit=True)
            logger.info("Market volume 1d refresh complete (rows=%s)", row_count)
        except Exception:
            await session.rollback()
            logger.exception("Failed to refresh market volume 1d")


async def refresh_market_stats_24h_once(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    async with session_maker() as session:
        try:
            row_count = await refresh_market_stats_24h(session, commit=True)
            logger.info("Market stats 24h refresh complete (rows=%s)", row_count)
        except Exception:
            await session.rollback()
            logger.exception("Failed to refresh market stats 24h")


async def refresh_market_stats_extended_once(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    async with session_maker() as session:
        try:
            row_count = await refresh_market_stats_extended(session, commit=True)
            logger.info("Market stats extended refresh complete (rows=%s)", row_count)
        except Exception:
            await session.rollback()
            logger.exception("Failed to refresh market stats extended")


async def refresh_market_discovery_stats_once(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    async with session_maker() as session:
        try:
            row_count = await refresh_market_discovery_stats(session, commit=True)
            logger.info("Market discovery stats refresh complete (rows=%s)", row_count)
        except Exception:
            await session.rollback()
            logger.exception("Failed to refresh market discovery stats")


async def run_periodic_market_volume_refresh(
    session_maker: async_sessionmaker[AsyncSession],
    interval_seconds: int = MARKET_VOLUME_1M_REFRESH_INTERVAL_SECONDS,
) -> None:
    await refresh_market_volume_1m_once(session_maker)
    while True:
        await asyncio.sleep(interval_seconds)
        await refresh_market_volume_1m_once(session_maker)


async def run_periodic_market_volume_daily_refresh(
    session_maker: async_sessionmaker[AsyncSession],
    interval_seconds: int = MARKET_VOLUME_1D_REFRESH_INTERVAL_SECONDS,
) -> None:
    await refresh_market_volume_1d_once(session_maker)
    while True:
        await asyncio.sleep(interval_seconds)
        await refresh_market_volume_1d_once(session_maker)


async def run_periodic_market_stats_24h_refresh(
    session_maker: async_sessionmaker[AsyncSession],
    interval_seconds: int = MARKET_STATS_24H_REFRESH_INTERVAL_SECONDS,
) -> None:
    await refresh_market_stats_24h_once(session_maker)
    while True:
        await asyncio.sleep(interval_seconds)
        await refresh_market_stats_24h_once(session_maker)


async def run_periodic_market_stats_extended_refresh(
    session_maker: async_sessionmaker[AsyncSession],
    interval_seconds: int = MARKET_STATS_EXTENDED_REFRESH_INTERVAL_SECONDS,
) -> None:
    await refresh_market_stats_extended_once(session_maker)
    while True:
        await asyncio.sleep(interval_seconds)
        await refresh_market_stats_extended_once(session_maker)


async def run_periodic_market_discovery_refresh(
    session_maker: async_sessionmaker[AsyncSession],
    interval_seconds: int = MARKET_DISCOVERY_REFRESH_INTERVAL_SECONDS,
) -> None:
    await refresh_market_discovery_stats_once(session_maker)
    while True:
        await asyncio.sleep(interval_seconds)
        await refresh_market_discovery_stats_once(session_maker)

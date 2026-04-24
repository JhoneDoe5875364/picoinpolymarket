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
                COALESCE(SUM(trade_count), 0) AS trade_count_24h
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
              trade_count_24h,
              trade_count_total,
              updated_at
            )
            SELECT
              m.id AS market_id,
              COALESCE(a.volume_24h, 0) AS volume_24h,
              COALESCE(ms.volume_1w, 0) AS volume_1w,
              COALESCE(ms.volume_1m, 0) AS volume_1m,
              COALESCE(ms.volume_total, 0) AS volume_total,
              COALESCE(a.trade_count_24h, 0) AS trade_count_24h,
              COALESCE(ms.trade_count_total, 0) AS trade_count_total,
              now() AS updated_at
            FROM markets m
            LEFT JOIN agg a ON a.market_id = m.id
            LEFT JOIN market_stats ms ON ms.market_id = m.id
            ON CONFLICT (market_id)
            DO UPDATE SET
              volume_24h = EXCLUDED.volume_24h,
              trade_count_24h = EXCLUDED.trade_count_24h,
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
                COALESCE(SUM(trade_count), 0) AS trade_count_total
              FROM market_volume_1d
              GROUP BY market_id
            )
            INSERT INTO market_stats (
              market_id,
              volume_24h,
              volume_1w,
              volume_1m,
              volume_total,
              trade_count_24h,
              trade_count_total,
              updated_at
            )
            SELECT
              m.id AS market_id,
              COALESCE(ms.volume_24h, 0) AS volume_24h,
              COALESCE(a.volume_1w, 0) AS volume_1w,
              COALESCE(a.volume_1m, 0) AS volume_1m,
              COALESCE(a.volume_total, 0) AS volume_total,
              COALESCE(ms.trade_count_24h, 0) AS trade_count_24h,
              COALESCE(a.trade_count_total, 0) AS trade_count_total,
              now() AS updated_at
            FROM markets m
            LEFT JOIN agg a ON a.market_id = m.id
            LEFT JOIN market_stats ms ON ms.market_id = m.id
            ON CONFLICT (market_id)
            DO UPDATE SET
              volume_1w = EXCLUDED.volume_1w,
              volume_1m = EXCLUDED.volume_1m,
              volume_total = EXCLUDED.volume_total,
              trade_count_total = EXCLUDED.trade_count_total,
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

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.logger import get_logger
from app.models.tables.market import Market

logger = get_logger()


def _seconds_until_next_hourly_close_check(now: datetime) -> float:
    next_run = now.replace(minute=41, second=10, microsecond=0)
    if now >= next_run:
        next_run += timedelta(hours=1)
    return max((next_run - now).total_seconds(), 0.0)


async def close_ended_markets_once(
    session_maker: async_sessionmaker[AsyncSession],
) -> int:
    now = datetime.now(timezone.utc)
    async with session_maker() as session:
        try:
            update_stmt = (
                update(Market)
                .where(
                    Market.end_date.is_not(None),
                    Market.end_date < now,
                    func.coalesce(Market.is_closed, False) == False,
                )
                .values(
                    is_closed=True,
                    closed_at=now,
                    status="pending",
                    updated_at=now,
                )
            )
            result = await session.execute(update_stmt)
            await session.commit()
            updated_count = result.rowcount or 0
            logger.info("Ended market close check complete (updated=%s)", updated_count)
            return updated_count
        except Exception:
            await session.rollback()
            logger.exception("Failed to close ended markets")
            return 0


async def run_periodic_market_close_refresh(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    while True:
        now = datetime.now(timezone.utc)
        await asyncio.sleep(_seconds_until_next_hourly_close_check(now))
        await close_ended_markets_once(session_maker)

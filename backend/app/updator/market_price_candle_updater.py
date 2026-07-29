from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.logger import get_logger
from app.models.tables.market import Market
from app.models.tables.market_price_candles import MarketPriceCandle
from app.models.tables.market_token import MarketToken
from app.models.tables.market_trades import MarketTrade

logger = get_logger()
# How often the live refresh runs. Candles bucket by 10 minutes, but a fresh
# trade should surface on the chart within ~1 minute, not after a full hour.
MARKET_CANDLE_REFRESH_INTERVAL_SECONDS = 60
# Backfill must step by the candle bucket size (10m), or it skips buckets and
# leaves gaps in the history.
_CANDLE_BUCKET_SECONDS = 600
_PRICE_QUANT = Decimal("0.0001")
_VOLUME_QUANT = Decimal("0.0001")


def _floor_to_10m_epoch_seconds(now: datetime) -> int:
    return int(now.timestamp()) // 600 * 600


def _safe_price(value: Decimal | None) -> Decimal:
    return (value or Decimal("0")).quantize(_PRICE_QUANT)


def _safe_volume(value: Decimal | None) -> Decimal:
    return (value or Decimal("0")).quantize(_VOLUME_QUANT)


async def refresh_market_price_candles_once(
    session: AsyncSession,
    timestamp: datetime,
    *,
    commit: bool = False,
) -> None:
    ts_bucket = _floor_to_10m_epoch_seconds(timestamp)

    token_rows = await session.execute(
        select(
            MarketToken.market_id,
            MarketToken.token,
            MarketToken.price,
            Market.volume,
        ).join(Market, Market.id == MarketToken.market_id)
    )

    inserted_count = 0
    updated_count = 0
    for market_id, token, token_price, market_volume in token_rows.all():
        price = _safe_price(token_price)
        volume = _safe_volume(market_volume)

        existing_result = await session.execute(
            select(MarketPriceCandle).where(
                MarketPriceCandle.market_id == market_id,
                MarketPriceCandle.token == token,
                MarketPriceCandle.ts == ts_bucket,
            )
        )
        candle = existing_result.scalar_one_or_none()
        if candle is None:
            session.add(
                MarketPriceCandle(
                    market_id=market_id,
                    token=token,
                    ts=ts_bucket,
                    open_price=price,
                    high_price=price,
                    low_price=price,
                    close_price=price,
                    volume=volume,
                    created_at=timestamp,
                    updated_at=timestamp,
                )
            )
            inserted_count += 1
            continue

        open_price = candle.open_price or price
        high_price = candle.high_price or price
        low_price = candle.low_price or price
        candle.open_price = _safe_price(open_price)
        candle.high_price = _safe_price(max(high_price, price))
        candle.low_price = _safe_price(min(low_price, price))
        candle.close_price = price
        candle.volume = volume
        candle.updated_at = timestamp
        updated_count += 1

    await session.flush()
    if commit:
        # flush() alone never persists: it emits SQL inside the open transaction
        # but nothing is durable until commit. Without this the periodic refresh
        # silently produced no new candles (chart froze at the last commit).
        await session.commit()
    logger.info(
        "Market price candle refresh complete (bucket=%s inserted=%s updated=%s)",
        ts_bucket,
        inserted_count,
        updated_count,
    )


async def refresh_market_price_candles_from_earliest_trade(
    session: AsyncSession
) -> None:
    earliest_row = await session.execute(select(func.min(MarketTrade.created_at)))
    earliest = earliest_row.scalar()
    if earliest is None:
        logger.info(
            "refresh_market_price_candles_from_earliest_trade skipped: "
            "no rows in market_trades"
        )
        return

    end = datetime.now(timezone.utc)
    ts = earliest
    while ts <= end:
        await refresh_market_price_candles_once(session, ts)
        ts += timedelta(seconds=_CANDLE_BUCKET_SECONDS)
    await session.commit()


async def _refresh_once_isolated(
    session_maker: async_sessionmaker[AsyncSession],
) -> None:
    """One refresh in its own short-lived session, committed and closed.

    A fresh session per cycle means a transient DB error can't poison every
    later cycle (the old single-long-session design froze all candles once its
    one transaction broke).
    """
    async with session_maker() as session:
        try:
            now = datetime.now(timezone.utc)
            await refresh_market_price_candles_once(session, now, commit=True)
        except Exception:
            await session.rollback()
            logger.exception("Failed to refresh market price candles")


async def run_periodic_market_price_candle_refresh(
    session_maker: async_sessionmaker[AsyncSession],
    interval_seconds: int = MARKET_CANDLE_REFRESH_INTERVAL_SECONDS,
) -> None:
    await _refresh_once_isolated(session_maker)
    while True:
        await asyncio.sleep(interval_seconds)
        await _refresh_once_isolated(session_maker)

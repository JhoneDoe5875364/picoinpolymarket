from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

_backend_root = Path(__file__).resolve().parent.parent
load_dotenv(_backend_root / ".env")
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.logger import get_logger, setup_logger
from app.db.session import create_engine_and_sessionmaker, dispose_engine
from app.routes import include_all_routers
from app.updator.market_close_updater import run_periodic_market_close_refresh
from app.updator.leaderboard_updater import run_periodic_leaderboard_refresh
from app.updator.market_price_candle_updater import run_periodic_market_price_candle_refresh
from app.updator.market_stats_updator import (
    run_periodic_market_discovery_refresh,
    run_periodic_market_stats_24h_refresh,
    run_periodic_market_stats_extended_refresh,
    run_periodic_market_volume_daily_refresh,
    run_periodic_market_volume_refresh,
)

setup_logger()
logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    leaderboard_task: asyncio.Task[None] | None = None
    market_candle_task: asyncio.Task[None] | None = None
    market_close_task: asyncio.Task[None] | None = None
    market_volume_task: asyncio.Task[None] | None = None
    market_volume_daily_task: asyncio.Task[None] | None = None
    market_stats_24h_task: asyncio.Task[None] | None = None
    market_stats_extended_task: asyncio.Task[None] | None = None
    market_discovery_task: asyncio.Task[None] | None = None
    try:
        engine, session_maker = create_engine_and_sessionmaker()
        app.state.async_engine = engine
        app.state.async_session_maker = session_maker
        logger.info("Database engine initialized")
        leaderboard_task = asyncio.create_task(
            run_periodic_leaderboard_refresh(session_maker),
            name="leaderboard-refresh",
        )
        app.state.leaderboard_refresh_task = leaderboard_task
        logger.info("Leaderboard refresh task started")
        market_candle_task = asyncio.create_task(
            run_periodic_market_price_candle_refresh(session_maker),
            name="market-price-candle-refresh",
        )
        app.state.market_candle_refresh_task = market_candle_task
        logger.info("Market price candle refresh task started")
        market_close_task = asyncio.create_task(
            run_periodic_market_close_refresh(session_maker),
            name="market-close-refresh",
        )
        app.state.market_close_refresh_task = market_close_task
        logger.info("Market close refresh task started")
        market_volume_task = asyncio.create_task(
            run_periodic_market_volume_refresh(session_maker),
            name="market-volume-refresh",
        )
        app.state.market_volume_refresh_task = market_volume_task
        logger.info("Market volume refresh task started")
        market_volume_daily_task = asyncio.create_task(
            run_periodic_market_volume_daily_refresh(session_maker),
            name="market-volume-daily-refresh",
        )
        app.state.market_volume_daily_refresh_task = market_volume_daily_task
        logger.info("Market volume daily refresh task started")
        market_stats_24h_task = asyncio.create_task(
            run_periodic_market_stats_24h_refresh(session_maker),
            name="market-stats-24h-refresh",
        )
        app.state.market_stats_24h_refresh_task = market_stats_24h_task
        logger.info("Market stats 24h refresh task started")
        market_stats_extended_task = asyncio.create_task(
            run_periodic_market_stats_extended_refresh(session_maker),
            name="market-stats-extended-refresh",
        )
        app.state.market_stats_extended_refresh_task = market_stats_extended_task
        logger.info("Market stats extended refresh task started")
        market_discovery_task = asyncio.create_task(
            run_periodic_market_discovery_refresh(session_maker),
            name="market-discovery-refresh",
        )
        app.state.market_discovery_refresh_task = market_discovery_task
        logger.info("Market discovery refresh task started")
    except Exception as e:
        logger.warning("Database not initialized: %s", e)
        app.state.async_engine = None
        app.state.async_session_maker = None
        app.state.leaderboard_refresh_task = None
        app.state.market_candle_refresh_task = None
        app.state.market_close_refresh_task = None
        app.state.market_volume_refresh_task = None
        app.state.market_volume_daily_refresh_task = None
        app.state.market_stats_24h_refresh_task = None
        app.state.market_stats_extended_refresh_task = None
        app.state.market_discovery_refresh_task = None
    yield
    if leaderboard_task is not None:
        leaderboard_task.cancel()
        try:
            await leaderboard_task
        except asyncio.CancelledError:
            logger.info("Leaderboard refresh task stopped")
    if market_candle_task is not None:
        market_candle_task.cancel()
        try:
            await market_candle_task
        except asyncio.CancelledError:
            logger.info("Market price candle refresh task stopped")
    if market_close_task is not None:
        market_close_task.cancel()
        try:
            await market_close_task
        except asyncio.CancelledError:
            logger.info("Market close refresh task stopped")
    if market_volume_task is not None:
        market_volume_task.cancel()
        try:
            await market_volume_task
        except asyncio.CancelledError:
            logger.info("Market volume refresh task stopped")
    if market_volume_daily_task is not None:
        market_volume_daily_task.cancel()
        try:
            await market_volume_daily_task
        except asyncio.CancelledError:
            logger.info("Market volume daily refresh task stopped")
    if market_stats_24h_task is not None:
        market_stats_24h_task.cancel()
        try:
            await market_stats_24h_task
        except asyncio.CancelledError:
            logger.info("Market stats 24h refresh task stopped")
    if market_stats_extended_task is not None:
        market_stats_extended_task.cancel()
        try:
            await market_stats_extended_task
        except asyncio.CancelledError:
            logger.info("Market stats extended refresh task stopped")
    if market_discovery_task is not None:
        market_discovery_task.cancel()
        try:
            await market_discovery_task
        except asyncio.CancelledError:
            logger.info("Market discovery refresh task stopped")
    await dispose_engine()
    logger.info("Database engine disposed")


app = FastAPI(
    title="PredictPiX API",
    version=os.getenv("API_VERSION", "0.1.0"),
    docs_url=os.getenv("DOCS_URL", "/docs"),
    redoc_url=os.getenv("REDOC_URL", "/redoc"),
    openapi_url=os.getenv("OPENAPI_URL", "/openapi.json"),
    lifespan=lifespan,
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:9002")
origins = [o.strip() for o in allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create_geo_enforcement(app)
include_all_routers(app)

logger.info("PredictPiX API routers mounted")

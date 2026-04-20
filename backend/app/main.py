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

from app.core.leaderboard_updater import run_periodic_leaderboard_refresh
from app.core.logger import get_logger, setup_logger
from app.db.session import create_engine_and_sessionmaker, dispose_engine
from app.routes import include_all_routers

setup_logger()
logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    leaderboard_task: asyncio.Task[None] | None = None
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
    except Exception as e:
        logger.warning("Database not initialized: %s", e)
        app.state.async_engine = None
        app.state.async_session_maker = None
        app.state.leaderboard_refresh_task = None
    yield
    if leaderboard_task is not None:
        leaderboard_task.cancel()
        try:
            await leaderboard_task
        except asyncio.CancelledError:
            logger.info("Leaderboard refresh task stopped")
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

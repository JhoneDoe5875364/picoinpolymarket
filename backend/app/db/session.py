from __future__ import annotations

from typing import Optional, Tuple

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.db.config import DATABASE_URL
from app.db.url import asyncpg_connect_args, to_async_sqlalchemy_url

_engine: Optional[AsyncEngine] = None
_session_maker: Optional[async_sessionmaker[AsyncSession]] = None


def create_engine_and_sessionmaker(
    url: Optional[str] = None,
) -> Tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    global _engine, _session_maker
    raw = url or DATABASE_URL
    if not raw:
        raise RuntimeError(
            "Database URL not configured: set DATABASE_URL (or POSTGRES_URL / "
            "SUPABASE_DB_URL) or PGHOST+PGDATABASE+PGUSER (+ PGPORT, PGPASSWORD)"
        )
    async_url = to_async_sqlalchemy_url(raw)
    _engine = create_async_engine(
        async_url,
        pool_pre_ping=True,
        echo=False,
        connect_args=asyncpg_connect_args(raw),
    )
    _session_maker = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    return _engine, _session_maker


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    if _session_maker is None:
        raise RuntimeError("Database not initialized; call create_engine_and_sessionmaker first")
    return _session_maker


async def dispose_engine() -> None:
    global _engine, _session_maker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_maker = None

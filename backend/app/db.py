# app/db.py
import os
import asyncpg
from typing import Optional
from fastapi import FastAPI
from urllib.parse import urlparse

# Prefer DATABASE_URL but accept a few common aliases
DATABASE_URL: Optional[str] = (
    os.getenv("DATABASE_URL")
    or os.getenv("POSTGRES_URL")
    or os.getenv("SUPABASE_DB_URL")
)

# -----------------------------
# asyncpg connection pool (used by FastAPI endpoints that use asyncpg)
# -----------------------------
async def init_pool(app: FastAPI):
    """
    Create a global asyncpg pool on app startup.
    """
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    app.state.pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=1,
        max_size=10,
        command_timeout=15,
    )

async def close_pool(app: FastAPI):
    """
    Close the global asyncpg pool on app shutdown.
    """
    pool = getattr(app.state, "pool", None)
    if pool:
        await pool.close()

# -----------------------------
# psycopg2 DSN shim (some modules expect this import)
# -----------------------------
def dsn_for_psycopg2(url: Optional[str] = None) -> str:
    """
    Return a DSN string suitable for psycopg/psycopg2 connect().
    We accept a standard PostgreSQL URI (postgres:// or postgresql://)
    and return it unchanged (psycopg accepts URIs).
    If no URL is provided, we use DATABASE_URL from the environment.
    """
    dsn = url or DATABASE_URL
    if not dsn:
        raise RuntimeError("DATABASE_URL is not set and no DSN was provided")

    # Normalize known scheme variants (e.g. postgresql+psycopg://)
    parsed = urlparse(dsn)
    scheme = (parsed.scheme or "").lower()

    if scheme in ("postgres", "postgresql"):
        # Already fine for psycopg2
        return dsn

    if scheme.startswith("postgresql+"):
        # Strip driver suffix like postgresql+psycopg
        return dsn.replace("postgresql+", "postgresql+", 1).replace("postgresql+psycopg", "postgresql")

    if scheme.startswith("postgres+"):
        return dsn.replace("postgres+", "postgres", 1)

    # If it's already libpq key=value style, just return it
    # (heuristic: contains spaces and '=' pairs)
    if " " in dsn and "=" in dsn:
        return dsn

    # Fallback: just return as-is; psycopg will raise a clear error if invalid
    return dsn

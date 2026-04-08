from __future__ import annotations

import asyncio
import ssl
from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

_backend_root = Path(__file__).resolve().parents[1]
load_dotenv(_backend_root / ".env")
load_dotenv()

from app.db.config import DATABASE_URL
from app.db.url import asyncpg_connect_args, to_async_sqlalchemy_url
from app.models import Base  # noqa: E402 — after load_dotenv
import app.models.tables  # noqa: E402, F401 — register all ORM tables on Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

if not DATABASE_URL:
    raise RuntimeError(
        "Set DATABASE_URL (or POSTGRES_URL / SUPABASE_DB_URL) or PGHOST+PGDATABASE+PGUSER for Alembic"
    )

_async_url = to_async_sqlalchemy_url(DATABASE_URL)
config.set_main_option("sqlalchemy.url", _async_url.replace("%", "%%"))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(
        _async_url,
        poolclass=pool.NullPool,
        connect_args=asyncpg_connect_args(DATABASE_URL or ""),
    )

    try:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
    except ssl.SSLError as exc:
        raise RuntimeError(
            "TLS to PostgreSQL failed (often certificate verify failed behind a proxy). "
            "For a trusted dev machine only, set DATABASE_SSL_INSECURE=1 or "
            "PGSSLMODE=noverify in the environment. Never use this in production."
        ) from exc
    finally:
        await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

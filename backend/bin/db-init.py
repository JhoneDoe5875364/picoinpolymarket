#!/usr/bin/env python
"""
Initialize PostgreSQL schema and seed demo rows (Alembic + optional seeds).

Examples::

    python bin/db-init.py
    python bin/db-init.py --seed-only
    python bin/db-init.py --no-seed

Requires ``DATABASE_URL`` (or related URL vars) or ``PGHOST``+``PGDATABASE``+``PGUSER`` (see ``app.db.config``).
For TLS issues behind proxies, set ``DATABASE_SSL_INSECURE=1`` (dev only).

``alembic/env.py`` uses ``asyncio.run()`` for migrations, so this script must not
call ``command.upgrade`` from inside another running event loop.
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_backend_root))

from dotenv import load_dotenv

load_dotenv(_backend_root / ".env")
load_dotenv()

from alembic import command
from alembic.config import Config

from app.db.config import DATABASE_URL
from app.db.seeds import run_seeds
from app.db.session import create_engine_and_sessionmaker, dispose_engine


async def _run_seeds() -> None:
    engine, session_maker = create_engine_and_sessionmaker()
    try:
        async with session_maker() as session:
            async with session.begin():
                await run_seeds(session)
        print("Seed data applied (idempotent).")
    finally:
        await dispose_engine()


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate and optionally seed.")
    parser.add_argument(
        "--no-seed",
        action="store_true",
        help="Only run migrations; skip seeds.",
    )
    parser.add_argument(
        "--seed-only",
        action="store_true",
        help="Only insert seeds; assumes schema already exists.",
    )
    args = parser.parse_args()
    seed = not args.no_seed
    run_migrations = not args.seed_only
    if args.seed_only:
        seed = True

    if not DATABASE_URL:
        print(
            "Missing database URL. Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL, "
            "or PGHOST, PGDATABASE, PGUSER (and PGPORT, PGPASSWORD, PGSSLMODE).",
            file=sys.stderr,
        )
        sys.exit(1)

    if run_migrations:
        cfg = Config(str(_backend_root / "alembic.ini"))
        command.upgrade(cfg, "head")
        print("Alembic upgraded to head.")

    if seed:
        asyncio.run(_run_seeds())


if __name__ == "__main__":
    main()

"""
GeoControl DDL helpers (idempotent). For versioned schema changes use Alembic
(``alembic/``, ``alembic upgrade head``).
"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.config import DATABASE_URL
from app.db.session import create_engine_and_sessionmaker, dispose_engine as dispose_db_engine

_COMPLIANCE_STATEMENTS: List[str] = [
    """
CREATE TABLE IF NOT EXISTS compliance_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    ip VARCHAR(45) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    state_code VARCHAR(10),
    tier VARCHAR(50) NOT NULL,
    category_key VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    result VARCHAR(50) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""".strip(),
    "CREATE INDEX IF NOT EXISTS idx_compliance_logs_user_id ON compliance_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_compliance_logs_ip ON compliance_logs(ip)",
    "CREATE INDEX IF NOT EXISTS idx_compliance_logs_region_code ON compliance_logs(region_code)",
    "CREATE INDEX IF NOT EXISTS idx_compliance_logs_timestamp ON compliance_logs(timestamp)",
]

_ATTESTATION_STATEMENTS: List[str] = [
    """
CREATE TABLE IF NOT EXISTS attestations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    state_code VARCHAR(10),
    attestation_version VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""".strip(),
    "CREATE INDEX IF NOT EXISTS idx_attestations_user_id ON attestations(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_attestations_timestamp ON attestations(timestamp)",
]


async def ensure_compliance_logs(session: AsyncSession) -> None:
    """Create compliance_logs table/indexes if missing (idempotent)."""
    for stmt in _COMPLIANCE_STATEMENTS:
        await session.execute(text(stmt))


async def migrate_database(url: Optional[str] = None) -> bool:
    try:
        raw = url or DATABASE_URL
        if not raw:
            print("❌ DATABASE_URL is not set")
            return False
        engine, _ = create_engine_and_sessionmaker(raw)
        async with engine.begin() as conn:
            for stmt in _COMPLIANCE_STATEMENTS + _ATTESTATION_STATEMENTS:
                await conn.execute(text(stmt))
        print("✅ GeoControl DDL applied")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        await dispose_db_engine()

"""
Database Schema Migration for GeoControl System
Creates compliance_logs and attestations tables
"""
import os
from typing import Optional

# PostgreSQL compatible versions
COMPLIANCE_LOGS_TABLE_PG = """
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
);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_user_id ON compliance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_ip ON compliance_logs(ip);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_region_code ON compliance_logs(region_code);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_timestamp ON compliance_logs(timestamp);
"""

ATTESTATIONS_TABLE_PG = """
CREATE TABLE IF NOT EXISTS attestations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    state_code VARCHAR(10),
    attestation_version VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attestations_user_id ON attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_attestations_timestamp ON attestations(timestamp);
"""


async def migrate_database(dsn: Optional[str] = None) -> bool:
    """
    Run database migrations
    """
    
    try:
        with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(COMPLIANCE_LOGS_TABLE_PG)
            print("✅ Created compliance_logs table")

            await conn.execute(ATTESTATIONS_TABLE_PG)
            print("✅ Created attestations table")

            await conn.close()
            print("✅ Database migrations completed successfully")

        return True
    
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

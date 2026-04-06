from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def insert_attestation(
    session: AsyncSession,
    *,
    user_id: str,
    ip: str,
    region_code: str,
    state_code: Optional[str],
    attestation_version: str,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO attestations (
                user_id, ip, region_code, state_code, attestation_version, timestamp
            )
            VALUES (:uid, :ip, :region, :state, :ver, :ts)
            """
        ),
        {
            "uid": user_id,
            "ip": ip,
            "region": region_code,
            "state": state_code,
            "ver": attestation_version,
            "ts": datetime.utcnow(),
        },
    )


async def get_latest_attestation(
    session: AsyncSession, user_id: str
) -> Optional[dict[str, Any]]:
    r = await session.execute(
        text(
            """
            SELECT * FROM attestations
            WHERE user_id = :uid
            ORDER BY timestamp DESC
            LIMIT 1
            """
        ),
        {"uid": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None

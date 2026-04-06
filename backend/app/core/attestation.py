"""
Attestation domain helpers — persistence in app.repositories.attestation.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import attestation as attestation_repo


async def create_attestation(
    session: AsyncSession,
    *,
    user_id: str,
    ip: str,
    region_code: str,
    state_code: Optional[str],
    attestation_version: str = "1.0",
) -> None:
    await attestation_repo.insert_attestation(
        session,
        user_id=user_id,
        ip=ip,
        region_code=region_code,
        state_code=state_code,
        attestation_version=attestation_version,
    )


async def get_latest_attestation(
    session: AsyncSession, user_id: str
) -> Optional[dict]:
    return await attestation_repo.get_latest_attestation(session, user_id)


async def has_valid_attestation(session: AsyncSession, user_id: str) -> bool:
    row = await attestation_repo.get_latest_attestation(session, user_id)
    return row is not None

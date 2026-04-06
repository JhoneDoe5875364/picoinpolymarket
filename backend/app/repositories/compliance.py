from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def insert_compliance_event(
    session: AsyncSession,
    *,
    user_id: Optional[str],
    ip: str,
    region_code: str,
    state_code: Optional[str],
    tier: str,
    category_key: Optional[str],
    action_type: str,
    result: str,
    reason: str,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO compliance_logs (
                user_id, ip, region_code, state_code, tier, category_key,
                action_type, result, reason, timestamp
            )
            VALUES (
                :user_id, :ip, :region_code, :state_code, :tier, :category_key,
                :action_type, :result, :reason, :ts
            )
            """
        ),
        {
            "user_id": user_id,
            "ip": ip,
            "region_code": region_code,
            "state_code": state_code,
            "tier": tier,
            "category_key": category_key,
            "action_type": action_type,
            "result": result,
            "reason": reason,
            "ts": datetime.utcnow(),
        },
    )


async def log_access_blocked(
    session: AsyncSession,
    *,
    ip: str,
    region_code: str,
    reason: str,
    user_id: Optional[str] = None,
    state_code: Optional[str] = None,
    category_key: Optional[str] = None,
) -> None:
    await insert_compliance_event(
        session,
        user_id=user_id,
        ip=ip,
        region_code=region_code,
        state_code=state_code,
        tier="full_block",
        category_key=category_key,
        action_type="access_attempt",
        result="blocked",
        reason=reason,
    )


async def log_category_restriction(
    session: AsyncSession,
    *,
    user_id: Optional[str],
    ip: str,
    region_code: str,
    category_key: str,
    reason: str,
    state_code: Optional[str] = None,
) -> None:
    await insert_compliance_event(
        session,
        user_id=user_id,
        ip=ip,
        region_code=region_code,
        state_code=state_code,
        tier="unknown",
        category_key=category_key,
        action_type="category_access",
        result="restricted",
        reason=reason,
    )

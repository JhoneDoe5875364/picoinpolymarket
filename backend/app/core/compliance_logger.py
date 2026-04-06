"""
Compliance logging — uses AsyncSession via request.app (no raw drivers).
"""
from __future__ import annotations

from typing import Optional

from fastapi import Request

from app.core.logger import get_logger
from app.repositories import compliance as compliance_repo

logger = get_logger()


async def _run_with_session(request: Request, coro_factory) -> None:
    maker = getattr(request.app.state, "async_session_maker", None)
    if maker is None:
        logger.warning("Compliance log skipped: async_session_maker not configured")
        return
    try:
        async with maker() as session:
            await coro_factory(session)
            await session.commit()
    except Exception as e:
        logger.error("Failed to log compliance event: %s", e)


async def log_access_blocked(
    request: Request,
    *,
    ip: str,
    region_code: str,
    reason: str,
    user_id: Optional[str] = None,
    state_code: Optional[str] = None,
    category_key: Optional[str] = None,
) -> None:
    await _run_with_session(
        request,
        lambda s: compliance_repo.log_access_blocked(
            s,
            ip=ip,
            region_code=region_code,
            reason=reason,
            user_id=user_id,
            state_code=state_code,
            category_key=category_key,
        ),
    )


async def log_category_restriction(
    request: Request,
    *,
    user_id: Optional[str],
    ip: str,
    region_code: str,
    category_key: str,
    reason: str,
    state_code: Optional[str] = None,
) -> None:
    await _run_with_session(
        request,
        lambda s: compliance_repo.log_category_restriction(
            s,
            user_id=user_id,
            ip=ip,
            region_code=region_code,
            category_key=category_key,
            reason=reason,
            state_code=state_code,
        ),
    )

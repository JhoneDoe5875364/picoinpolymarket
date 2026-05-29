"""Admin audit trail helpers (compliance_logs with tier=admin)."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import compliance as compliance_repo

ADMIN_TIER = "admin"


def _client_ip(request: Optional[Request]) -> str:
    if request is None:
        return "0.0.0.0"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:45]
    if request.client and request.client.host:
        return request.client.host[:45]
    return "0.0.0.0"


def _admin_label(admin_user: dict[str, Any]) -> str:
    username = str(admin_user.get("username") or "").strip()
    sub = str(admin_user.get("sub") or "").strip()
    if username and sub:
        return f"{username} ({sub})"
    return username or sub or "unknown_admin"


async def log_admin_action(
    session: AsyncSession,
    *,
    request: Optional[Request],
    admin_user: dict[str, Any],
    action_type: str,
    detail: str,
    category_key: Optional[str] = None,
    result: str = "success",
) -> None:
    """Record an admin action in compliance_logs for the audit log UI."""
    admin_id = str(admin_user.get("sub") or "").strip() or None
    reason = f"[{_admin_label(admin_user)}] {detail}"
    await compliance_repo.insert_compliance_event(
        session,
        user_id=admin_id,
        ip=_client_ip(request),
        region_code="ADMIN",
        state_code=None,
        tier=ADMIN_TIER,
        category_key=category_key,
        action_type=action_type,
        result=result,
        reason=reason,
    )

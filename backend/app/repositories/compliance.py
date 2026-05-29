from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.migrations import ensure_compliance_logs

ADMIN_AUDIT_ACTION_TYPES = frozenset(
    {
        "market_created",
        "market_edited",
        "market_closed",
        "market_resolved",
        "payout_generated",
        "payout_marked_paid",
        "payout_flagged",
        "user_banned",
        "user_suspended",
        "user_status_changed",
        "comment_removed",
        "clarification_posted",
        "rules_changed",
        "manual_override",
    }
)


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
    await ensure_compliance_logs(session)
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


async def list_admin_audit_log(
    session: AsyncSession,
    *,
    event_type: Optional[str] = None,
    user_id: Optional[str] = None,
    market_id: Optional[int] = None,
    manual_override_only: bool = False,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[dict[str, Any]], int]:
    """Paginated admin audit entries (tier=admin or known admin action types)."""
    await ensure_compliance_logs(session)

    if event_type and event_type not in ADMIN_AUDIT_ACTION_TYPES:
        raise ValueError("Invalid event_type filter")

    action_in_sql = ", ".join(
        f"'{action}'" for action in sorted(ADMIN_AUDIT_ACTION_TYPES)
    )
    conditions = [f"(tier = :admin_tier OR action_type IN ({action_in_sql}))"]
    params: dict[str, Any] = {
        "admin_tier": "admin",
        "limit": limit,
        "offset": offset,
    }

    if manual_override_only:
        conditions.append("action_type = 'manual_override'")
    elif event_type:
        conditions.append("action_type = :event_type")
        params["event_type"] = event_type

    if user_id:
        conditions.append("user_id = :filter_user_id")
        params["filter_user_id"] = user_id

    if market_id is not None:
        conditions.append("category_key = :market_key")
        params["market_key"] = f"market:{market_id}"

    if date_from is not None:
        conditions.append("timestamp >= :date_from")
        params["date_from"] = date_from

    if date_to is not None:
        conditions.append("timestamp <= :date_to")
        params["date_to"] = date_to

    where_sql = " AND ".join(conditions)

    count_sql = f"SELECT COUNT(*) FROM compliance_logs WHERE {where_sql}"
    count_row = await session.execute(text(count_sql), params)
    total = int(count_row.scalar_one() or 0)

    list_sql = f"""
        SELECT id, user_id, ip, region_code, state_code, tier, category_key,
               action_type, result, reason, timestamp
        FROM compliance_logs
        WHERE {where_sql}
        ORDER BY timestamp DESC, id DESC
        LIMIT :limit OFFSET :offset
    """
    result = await session.execute(text(list_sql), params)
    rows = [dict(r) for r in result.mappings().all()]
    return rows, total


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

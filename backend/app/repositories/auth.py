from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uuid_utils import as_uuid
from app.models.tables.user import User


def _user_dict(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "pi_username": user.pi_username,
        "role_id": user.role_id,
    }


async def get_user_by_id(session: AsyncSession, user_id: str) -> Optional[dict[str, Any]]:
    try:
        uid = as_uuid(user_id)
    except (ValueError, TypeError):
        return None

    stmt = select(User).where(User.id == uid)
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return _user_dict(row) if row else None


async def insert_user(
    session: AsyncSession, *, user_id: str, username: str
) -> dict[str, Any]:
    try:
        uid = as_uuid(user_id)
    except (ValueError, TypeError) as exc:
        raise ValueError("invalid user_id") from exc
    user = User(id=uid, pi_username=username, role_id=3, status="active")
    session.add(user)
    await session.flush()
    return _user_dict(user)

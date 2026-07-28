from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.user import User


def _user_dict(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "pi_username": user.pi_username,
        "role_id": user.role_id,
    }


async def get_user_by_id(session: AsyncSession, user_id: str) -> Optional[dict[str, Any]]:
    uid_int: int | None
    try:
        uid_int = int(user_id)
    except (ValueError, TypeError):
        uid_int = None
    if uid_int is not None:
        stmt = select(User).where(User.id == uid_int)
    else:
        stmt = select(User).where(User.pi_uid == user_id)
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return _user_dict(row) if row else None


async def touch_login_timestamp(session: AsyncSession, internal_user_id: int) -> None:
    await session.execute(
        update(User).where(User.id == internal_user_id).values(updated_at=func.now())
    )


async def insert_user(
    session: AsyncSession, *, user_id: str, username: str
) -> dict[str, Any]:
    user = User(
        pi_uid=str(user_id),
        pi_username=username,
        role_id=3,
        status="ACTIVE",  # must match the user_status enum (uppercase)
    )
    session.add(user)
    await session.flush()
    return _user_dict(user)

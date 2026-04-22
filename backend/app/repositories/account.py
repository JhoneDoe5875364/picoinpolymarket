from __future__ import annotations

from typing import Any, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession



async def user_info_row(session: AsyncSession, user_id: str) -> dict[str, Any] | None:
    q = text(
        """
        SELECT id, pi_username, created_at, referral_code, referred_by
        FROM users WHERE id = :uid
        """
    )
    r = await session.execute(q, {"uid": int(user_id)})
    row = r.mappings().first()
    return dict(row) if row else None


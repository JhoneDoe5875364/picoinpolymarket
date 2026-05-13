from __future__ import annotations

from typing import Any, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession



async def user_info_row(session: AsyncSession, user_id: str) -> dict[str, Any] | None:
    q = text(
        """
        SELECT id, pi_uid, pi_username, created_at, referral_code, referred_by, updated_at
        FROM users WHERE id = :uid
        """
    )
    r = await session.execute(q, {"uid": int(user_id)})
    row = r.mappings().first()
    if not row:
        return None
    out = dict(row)
    wallet_q = text(
        """
        SELECT wallet_address, updated_at AS wallet_record_updated_at
        FROM leaderboards
        WHERE user_id = :uid
          AND wallet_address IS NOT NULL
          AND TRIM(wallet_address) <> ''
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 1
        """
    )
    wr = await session.execute(wallet_q, {"uid": int(user_id)})
    wallet_row = wr.mappings().first()
    if wallet_row:
        out["wallet_address"] = wallet_row["wallet_address"]
        out["wallet_record_updated_at"] = wallet_row["wallet_record_updated_at"]
    else:
        out["wallet_address"] = None
        out["wallet_record_updated_at"] = None
    return out


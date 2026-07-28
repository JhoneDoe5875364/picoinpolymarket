from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Pi/Stellar public addresses: base32, start with G, 56 chars.
_PI_ADDRESS_RE = re.compile(r"^G[A-Z2-7]{55}$")


def normalize_wallet_address(raw: str | None) -> str:
    """Validate and normalize a Pi wallet address, or raise ValueError."""
    addr = (raw or "").strip()
    if not addr:
        raise ValueError("Wallet address is required")
    addr = addr.upper()
    if not _PI_ADDRESS_RE.match(addr):
        raise ValueError("Invalid Pi wallet address (must start with G and be 56 characters)")
    return addr


async def user_info_row(session: AsyncSession, user_id: str) -> dict[str, Any] | None:
    q = text(
        """
        SELECT id, pi_uid, pi_username, created_at, referral_code, referred_by,
               updated_at, wallet_address, wallet_updated_at
        FROM users WHERE id = :uid
        """
    )
    r = await session.execute(q, {"uid": int(user_id)})
    row = r.mappings().first()
    if not row:
        return None
    out = dict(row)
    out["wallet_record_updated_at"] = out.get("wallet_updated_at")
    return out


async def set_wallet_address(
    session: AsyncSession, *, user_id: str, wallet_address: str
) -> dict[str, Any]:
    """Store the user's payout wallet address (validated by caller)."""
    now = datetime.now(timezone.utc)
    stmt = text(
        """
        UPDATE users
        SET wallet_address = :addr, wallet_updated_at = :now, updated_at = :now
        WHERE id = :uid
        RETURNING id, wallet_address, wallet_updated_at
        """
    )
    result = await session.execute(
        stmt, {"addr": wallet_address, "now": now, "uid": int(user_id)}
    )
    row = result.mappings().first()
    await session.commit()
    if not row:
        raise LookupError("User not found")
    return dict(row)


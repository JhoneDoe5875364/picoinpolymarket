from __future__ import annotations

from typing import Any, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def open_positions(session: AsyncSession, user_id: str) -> List[dict[str, Any]]:
    q = text(
        """
        SELECT position_id, market_id, market_title, side, amount, status
        FROM v_portfolio_open_markets
        WHERE status = 'open' AND user_id = :uid
        """
    )
    r = await session.execute(q, {"uid": str(user_id)})
    return [dict(x) for x in r.mappings().all()]


async def user_info_row(session: AsyncSession, user_id: str) -> dict[str, Any] | None:
    q = text(
        """
        SELECT id, pi_username, created_at, referral_code, referred_by
        FROM users WHERE id = :uid
        """
    )
    r = await session.execute(q, {"uid": str(user_id)})
    row = r.mappings().first()
    return dict(row) if row else None


async def recent_activity(session: AsyncSession, user_id: str) -> List[dict[str, Any]]:
    q = text(
        """
        SELECT position_id, market_id, market_title, side, amount, status,
               created_at AS date, resolved_outcome AS outcome
        FROM v_portfolio_open_markets
        WHERE user_id = :uid
        LIMIT 10
        """
    )
    r = await session.execute(q, {"uid": str(user_id)})
    return [dict(x) for x in r.mappings().all()]


async def transaction_history(
    session: AsyncSession, user_id: str
) -> List[dict[str, Any]]:
    q = text(
        """
        SELECT id, date, type, status, amount, pi_amount, details
        FROM transactions
        WHERE user_id = :uid
        """
    )
    r = await session.execute(q, {"uid": str(user_id)})
    return [dict(x) for x in r.mappings().all()]


async def claim_payouts_flow(session: AsyncSession, user_id: str) -> tuple[Any, Any]:
    """Returns (total_balance_after, claimed_amount)."""
    ur = await session.execute(
        text("SELECT id, balance FROM users WHERE id = :uid"),
        {"uid": str(user_id)},
    )
    row = ur.mappings().first()
    if not row:
        raise LookupError("User not found")
    total_balance = row["balance"] or 0

    cr = await session.execute(
        text(
            """
            SELECT SUM(unclaimed_pi) AS balance
            FROM v_portfolio_unclaimed
            WHERE user_id = :uid
            """
        ),
        {"uid": user_id},
    )
    crow = cr.mappings().first()
    claimable_balance = (crow["balance"] or 0) if crow else 0

    if claimable_balance <= 0:
        return total_balance, 0

    await session.execute(
        text("UPDATE trades SET invalid = true WHERE user_id = :uid"),
        {"uid": user_id},
    )

    ir = await session.execute(
        text(
            """
            INSERT INTO transactions (user_id, market_id, amount, pi_amount, type, status, details, date)
            VALUES (:uid, :mid, :amt, :amt, 'claim-payouts', 'completed', 'Claim All Payouts', CURRENT_DATE)
            RETURNING *
            """
        ),
        {"uid": user_id, "mid": None, "amt": claimable_balance},
    )
    if not ir.mappings().first():
        raise RuntimeError("Failed to create transaction")

    new_balance = total_balance + claimable_balance
    up = await session.execute(
        text("UPDATE users SET balance = :bal WHERE id = :uid RETURNING balance"),
        {"bal": new_balance, "uid": user_id},
    )
    updated = up.mappings().first()
    if not updated:
        raise RuntimeError("Failed to update user balance")
    return updated["balance"] or 0, claimable_balance

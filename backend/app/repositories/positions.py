from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_market_snapshot_prices(
    session: AsyncSession, market_id: int
) -> dict[str, Any]:
    q = text(
        """
        SELECT id, title, yes_pct, no_pct, status
        FROM v_market_snapshots
        WHERE id = :mid
        """
    )
    r = await session.execute(q, {"mid": market_id})
    row = r.mappings().first()
    if not row:
        raise LookupError("Market not found")
    d = dict(row)
    if d.get("status") != "open":
        raise ValueError("Market is not open")
    if d.get("yes_pct") is None or d.get("no_pct") is None:
        raise ValueError("Missing market prices")
    yes_price = float(d["yes_pct"]) / 100.0
    no_price = float(d["no_pct"]) / 100.0
    if yes_price <= 0 or no_price <= 0:
        raise ValueError("Invalid market prices")
    return {
        "id": d["id"],
        "title": d.get("title", ""),
        "yes_price": yes_price,
        "no_price": no_price,
    }


async def insert_position_with_tx(
    session: AsyncSession,
    *,
    user_id: int,
    market_id: int,
    side: str,
    buy_units: float,
    pi_amount: float,
    tx_type: str,
    market_title: str,
) -> dict[str, Any]:
    pr = await session.execute(
        text(
            """
            INSERT INTO positions (user_id, market_id, side, amount, pi_amount, created_at)
            VALUES (:uid, :mid, :side, :units, :pi, NOW())
            RETURNING *
            """
        ),
        {
            "uid": user_id,
            "mid": market_id,
            "side": side,
            "units": buy_units,
            "pi": pi_amount,
        },
    )
    position_row = pr.mappings().first()
    if not position_row:
        raise RuntimeError("Failed to create position")

    await session.execute(
        text(
            """
            INSERT INTO transactions (user_id, market_id, amount, pi_amount, type, status, details, date)
            VALUES (:uid, :mid, :amt, :pi, :txtype, 'completed', :details, CURRENT_DATE)
            """
        ),
        {
            "uid": user_id,
            "mid": market_id,
            "amt": buy_units,
            "pi": -pi_amount,
            "txtype": tx_type,
            "details": market_title,
        },
    )
    return dict(position_row)

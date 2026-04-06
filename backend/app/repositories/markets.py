from __future__ import annotations

import uuid
from typing import Any, List, Optional

from sqlalchemy import inspect as sa_inspect, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.tables.market import Market


def market_to_dict(m: Market) -> dict[str, Any]:
    """Return mapped ``Market`` columns plus ``category`` slug (when relationship is loaded)."""
    d = {col.key: getattr(m, col.key) for col in sa_inspect(Market).mapper.columns}
    cr = m.category
    d["category"] = cr.slug if cr is not None else None
    return d


async def list_opened_markets(session: AsyncSession) -> List[dict[str, Any]]:
    stmt = (
        select(Market)
        .options(selectinload(Market.category))
        .where(Market.status == "open")
        .order_by(Market.created_at.desc())
        .limit(10)
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [market_to_dict(m) for m in rows]


async def get_market_by_id(session: AsyncSession, market_id: uuid.UUID) -> Optional[dict[str, Any]]:
    stmt = (
        select(Market)
        .options(selectinload(Market.category))
        .where(Market.id == market_id)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return market_to_dict(row) if row else None


async def list_resolved_markets(session: AsyncSession) -> List[dict[str, Any]]:
    stmt = (
        select(Market)
        .options(selectinload(Market.category))
        .where(Market.is_resolved == True)
        .order_by(Market.created_at.desc())
        .limit(10)
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [market_to_dict(m) for m in rows]



########################################################
# Old functions
########################################################
async def get_market_snapshot(
    session: AsyncSession, market_id: uuid.UUID
) -> Optional[dict[str, Any]]:
    q = text(
        """
        SELECT id, title, description, created_at, end_date, resolved_at, status, category,
               total_volume, yes_volume, no_volume, yes_pct, no_pct
        FROM v_market_snapshots
        WHERE id = :mid
        """
    )
    r = await session.execute(q, {"mid": str(market_id)})
    row = r.mappings().first()
    return dict(row) if row else None


async def count_traders(session: AsyncSession, market_id: uuid.UUID) -> int:
    q = text(
        """
        SELECT COUNT(*) AS traders
        FROM trades
        WHERE market_id = :mid
        """
    )
    r = await session.execute(q, {"mid": str(market_id)})
    row = r.mappings().first()
    return int(row["traders"] or 0) if row else 0


async def market_price_history(
    session: AsyncSession, market_id: uuid.UUID
) -> List[dict[str, Any]]:
    q = text(
        """
        SELECT ts_date AS date, yes_pct AS probability
          FROM market_price_history
         WHERE market_id = :mid
         ORDER BY date ASC
        """
    )
    r = await session.execute(q, {"mid": str(market_id)})
    return [dict(row) for row in r.mappings().all()]


async def recent_trades(
    session: AsyncSession, market_id: uuid.UUID, limit: int
) -> List[dict[str, Any]]:
    q = text(
        """
        SELECT t.id, t.user_id, u.pi_username, t.type, t.side, t.pi_amount, t.created_at
        FROM trades t
        JOIN users u ON t.user_id = u.id
        WHERE t.market_id = :mid
        ORDER BY t.created_at DESC
        LIMIT :lim
        """
    )
    r = await session.execute(q, {"mid": str(market_id), "lim": limit})
    return [dict(row) for row in r.mappings().all()]


async def get_market_status_row(
    session: AsyncSession, market_id: uuid.UUID
) -> Optional[dict[str, Any]]:
    q = text("SELECT id, status FROM markets WHERE id = :mid")
    r = await session.execute(q, {"mid": str(market_id)})
    row = r.mappings().first()
    return dict(row) if row else None


async def insert_position_simple(
    session: AsyncSession,
    user_id: str,
    market_id: uuid.UUID,
    side: str,
    amount: float,
) -> dict[str, Any]:
    q = text(
        """
        INSERT INTO positions (user_id, market_id, side, amount, created_at)
        VALUES (:uid, :mid, :side, :amt, NOW())
        RETURNING *
        """
    )
    r = await session.execute(
        q,
        {"uid": user_id, "mid": str(market_id), "side": side, "amt": amount},
    )
    row = r.mappings().first()
    if not row:
        raise RuntimeError("Failed to create position")
    return dict(row)


async def leaderboard(session: AsyncSession, limit: int) -> List[dict[str, Any]]:
    q = text(
        """
        SELECT RANK() OVER (ORDER BY volume DESC) AS rank,
               user_id, username, volume, success_pct AS accuracy
        FROM v_leaderboard
        ORDER BY volume DESC
        LIMIT :lim
        """
    )
    r = await session.execute(q, {"lim": limit})
    return [dict(row) for row in r.mappings().all()]

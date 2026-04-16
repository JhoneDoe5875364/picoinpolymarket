from __future__ import annotations

from typing import Any, List, Optional

from sqlalchemy import inspect as sa_inspect, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.leaderboard import Leaderboard


def leaderboard_to_dict(row: Leaderboard) -> dict[str, Any]:
    return {col.key: getattr(row, col.key) for col in sa_inspect(Leaderboard).mapper.columns}


async def list_leaderboard(
    session: AsyncSession,
    *,
    limit: Optional[int] = 50,
    offset: int = 0,
) -> List[dict[str, Any]]:
    stmt = select(Leaderboard).order_by(Leaderboard.rank.asc()).offset(offset)
    if limit is not None:
        stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [leaderboard_to_dict(row) for row in rows]

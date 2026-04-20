from typing import Any, Literal

from fastapi import APIRouter, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy import inspect as sa_inspect, select

from app.db.deps import DbSession
from app.models.tables.category import Category
from app.models.tables.leaderboard import Leaderboard

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])



def _leaderboard_to_dict(row: Leaderboard) -> dict[str, Any]:
    return {col.key: getattr(row, col.key) for col in sa_inspect(Leaderboard).mapper.columns}


@router.get("/", summary="List leaderboard")
async def get_leaderboard(
    db: DbSession,
    category: str = Query(..., min_length=1),
    time_bucket: Literal["1D", "1W", "1M", "ALL"] = Query(...),
    order_by: Literal["VOL", "PNL"] = Query(...),
    limit: int = Query(default=50, ge=1),
    offset: int = Query(default=0, ge=0),
):
    base_stmt = (
        select(Leaderboard)
        .where(Leaderboard.time_bucket == time_bucket, Leaderboard.category == category)
        .order_by(Leaderboard.vol.desc() if order_by == "VOL" else Leaderboard.pnl.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(base_stmt)
    records = result.scalars().all()

    rows = [{"rank": offset + idx + 1, **_leaderboard_to_dict(row)} for idx, row in enumerate(records)]
    return {"ok": True, "data": jsonable_encoder(rows)}


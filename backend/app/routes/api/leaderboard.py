from typing import Any, Literal

from fastapi import APIRouter, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy import inspect as sa_inspect, select

from app.db.deps import DbSession
from app.models.tables.category import Category
from app.models.tables.leaderboard import Leaderboard

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


def _to_float(value: Any) -> float:
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


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
        .join(Category, Leaderboard.category_id == Category.id)
    )

    where_clause = [
        Leaderboard.time_bucket == time_bucket
    ]
    if category != "All":
        where_clause.append(Category.name == category)

    sort_col = Leaderboard.vol if order_by == "VOL" else Leaderboard.pnl
    stmt = (
        base_stmt
        .where(*where_clause)
        .order_by(sort_col.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    rows = [{**_leaderboard_to_dict(row), "rank": offset + idx + 1} for idx, row in enumerate(records)]
    return {"ok": True, "items": jsonable_encoder(rows)}


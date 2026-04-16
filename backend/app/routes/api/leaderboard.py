from typing import Literal

from fastapi import APIRouter, Query
from fastapi.encoders import jsonable_encoder

from app.db.deps import DbSession
from app.repositories import leaderboard as leaderboard_repo

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/", summary="List leaderboard")
async def get_leaderboard(
    db: DbSession,
    category_id: int = Query(..., ge=1),
    time_bucket: str = Query(..., min_length=1),
    order_by: Literal["VOL", "PNL"] = Query(...),
    limit: int = Query(default=50, ge=1),
    offset: int = Query(default=0, ge=0),
):
    rows = await leaderboard_repo.list_leaderboard(
        db,
        category_id=category_id,
        time_bucket=time_bucket,
        order_by=order_by,
        limit=limit,
        offset=offset,
    )
    return {"ok": True, "items": jsonable_encoder(rows)}

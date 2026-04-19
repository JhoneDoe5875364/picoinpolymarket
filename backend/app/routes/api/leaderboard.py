from typing import Any, Literal

from fastapi import APIRouter, Query
from fastapi.encoders import jsonable_encoder

from app.db.deps import DbSession
from app.repositories import leaderboard as leaderboard_repo

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

CATEGORY_TO_ID: dict[str, int] = {
    "All": 0,
    "Politics": 1,
    "Sports": 2,
    "Crypto": 3,
    "Esports": 4,
    "Finance": 5,
    "Geopolitics": 6,
    "Tech": 7,
    "Culture": 8,
    "Economy": 9,
    "Weather": 10,
}


def _to_float(value: Any) -> float:
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


@router.get("/", summary="List leaderboard")
async def get_leaderboard(
    db: DbSession,
    category: str = Query(..., min_length=1),
    time_bucket: Literal["1D", "1W", "1M", "ALL"] = Query(...),
    order_by: Literal["VOL", "PNL"] = Query(...),
    limit: int = Query(default=50, ge=1),
    offset: int = Query(default=0, ge=0),
):
    normalized = category.strip().lower()
    id_by_normalized = {name.lower(): category_id for name, category_id in CATEGORY_TO_ID.items()}

    if normalized == "all":
        category_ids = list(CATEGORY_TO_ID.values())
    else:
        category_id = id_by_normalized.get(normalized)
        if category_id is None:
            allowed = "All, " + ", ".join(CATEGORY_TO_ID.keys())
            return {"ok": False, "items": [], "error": f"Invalid category '{category}'. Allowed: {allowed}"}
        category_ids = [category_id]

    if len(category_ids) == 1:
        rows = await leaderboard_repo.list_leaderboard(
            db,
            category_id=category_ids[0],
            time_bucket=time_bucket,
            order_by=order_by,
            limit=limit,
            offset=offset,
        )
        return {"ok": True, "items": jsonable_encoder(rows)}

    merged_by_user: dict[Any, dict[str, Any]] = {}
    for category_id in category_ids:
        category_rows = await leaderboard_repo.list_leaderboard(
            db,
            category_id=category_id,
            time_bucket=time_bucket,
            order_by=order_by,
            limit=None,
            offset=0,
        )
        for row in category_rows:
            user_id = row.get("user_id")
            if user_id not in merged_by_user:
                merged_by_user[user_id] = dict(row)
                merged_by_user[user_id]["vol"] = _to_float(row.get("vol"))
                merged_by_user[user_id]["pnl"] = _to_float(row.get("pnl"))
            else:
                merged_by_user[user_id]["vol"] += _to_float(row.get("vol"))
                merged_by_user[user_id]["pnl"] += _to_float(row.get("pnl"))

    score_key = "vol" if order_by == "VOL" else "pnl"
    ordered_rows = sorted(
        merged_by_user.values(),
        key=lambda row: _to_float(row.get(score_key)),
        reverse=True,
    )
    sliced_rows = ordered_rows[offset : offset + limit]
    rows = [{**row, "rank": offset + idx + 1} for idx, row in enumerate(sliced_rows)]

    return {"ok": True, "items": jsonable_encoder(rows)}

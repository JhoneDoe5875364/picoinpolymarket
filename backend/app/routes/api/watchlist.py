from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import watchlist as watchlist_repo

logger = get_logger()

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


def _get_user_id(user: dict) -> int:
    raw_sub = user.get("sub")
    try:
        user_id = int(raw_sub) if raw_sub is not None else None
    except (TypeError, ValueError):
        user_id = None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid user id in token")
    return user_id


@router.get("/", summary="List watchlisted market ids")
async def list_watchlist(
    db: DbSession,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    user=Depends(verify_token),
):
    user_id = _get_user_id(user)
    market_ids = await watchlist_repo.list_watchlisted_market_ids(
        db,
        user_id=user_id,
        offset=offset,
        limit=limit,
    )
    total = await watchlist_repo.watchlist_count(db, user_id=user_id)
    return {
        "ok": True,
        "data": {
            "market_ids": market_ids,
            "total": total,
        },
    }


@router.post("/{market_id:int}/toggle", summary="Toggle market on watchlist")
async def toggle_watchlist(
    db: DbSession,
    market_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    user_id = _get_user_id(user)
    try:
        async with db.begin():
            data = await watchlist_repo.toggle_watchlist(
                db,
                user_id=user_id,
                market_id=market_id,
            )
    except LookupError:
        raise HTTPException(status_code=404, detail="Market not found") from None
    except Exception as exc:
        logger.error("Error toggling watchlist for market %s: %s", market_id, exc)
        raise HTTPException(status_code=500, detail="Failed to toggle watchlist") from exc

    return {"ok": True, "data": jsonable_encoder(data)}

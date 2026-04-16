from datetime import datetime
from decimal import Decimal
from typing import Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.encoders import jsonable_encoder

from app.core.config import Config
from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import markets as markets_repo

logger = get_logger()

router = APIRouter(prefix="/markets", tags=["markets"])

FEE_RATE = Config.FEE_RATE


@router.get("/", summary="List markets")
async def list_markets(
    db: DbSession,
    limit: int = Query(default=10, ge=1),
    offset: int = Query(default=0, ge=0),
    order: str = Query(default="created_at"),
    ascending: bool = Query(default=False),
    closed: Optional[bool] = Query(default=None),
    resolved: Optional[bool] = Query(default=None),
    volume_min: Optional[Union[Decimal, float]] = Query(default=None),
    volume_max: Optional[Union[Decimal, float]] = Query(default=None),
    start_date_min: Optional[datetime] = Query(default=None),
    start_date_max: Optional[datetime] = Query(default=None),
    end_date_min: Optional[datetime] = Query(default=None),
    end_date_max: Optional[datetime] = Query(default=None),
):
    rows = await markets_repo.list_markets(
        db,
        limit=limit,
        offset=offset,
        order=order,
        ascending=ascending,
        closed=closed,
        resolved=resolved,
        volume_min=volume_min,
        volume_max=volume_max,
        start_date_min=start_date_min,
        start_date_max=start_date_max,
        end_date_min=end_date_min,
        end_date_max=end_date_max,
    )
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/{market_id:int}", summary="Get market by id")
async def get_market_by_id(market_id: int, db: DbSession):
    row = await markets_repo.get_market_by_id(db, market_id)
    if not row:
        raise HTTPException(status_code=404, detail="Market not found")
    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/prices-history")
async def get_market_prices_history(
    db: DbSession,
    market_id: int = Query(..., ge=1),
    start_ts: Optional[datetime] = Query(default=None),
    end_ts: Optional[datetime] = Query(default=None),
    interval: Optional[str] = Query(default='1m'),
):
    allowed_intervals = {"1m", "10m", "1h", "1d"}
    if interval not in allowed_intervals:
        raise HTTPException(
            status_code=400,
            detail="Invalid interval. Allowed values are: 1m, 10m, 1h, 1d",
        )

    rows = await markets_repo.market_prices_history(
        db,
        market_id,
        start_ts=start_ts,
        end_ts=end_ts,
        interval=interval,
    )
    return {"ok": True, "data": jsonable_encoder(rows or [])}

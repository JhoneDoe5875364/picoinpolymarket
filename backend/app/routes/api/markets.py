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


@router.get("/leaderboard")
async def get_leaderboard(db: DbSession, limit: int = 50):
    rows = await markets_repo.leaderboard(db, limit)
    return {"ok": True, "items": jsonable_encoder(rows)}


@router.get("/{market_id:int}/price-history")
async def get_market_price_history(market_id: int, db: DbSession):
    rows = await markets_repo.market_price_history(db, market_id)
    return {"ok": True, "data": jsonable_encoder(rows or [])}


@router.get("/{market_id:int}/recent-trades")
async def get_recent_trades(market_id: int, db: DbSession, limit: int = 50):
    rows = await markets_repo.recent_trades(db, market_id, limit)
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.post("/{market_id:int}/trade")
async def create_market_trade(
    market_id: int,
    request: Request,
    db: DbSession,
    user=Depends(verify_token),
):
    raw_sub = user.get("sub")
    try:
        user_id = int(raw_sub) if raw_sub is not None else None
    except (TypeError, ValueError):
        user_id = None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid user id in token")
    data = await request.json()
    side = data.get("side")
    amount = data.get("amount")

    if side not in ("yes", "no"):
        raise HTTPException(status_code=400, detail="side must be 'yes' or 'no'")
    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than 0")

    fee = amount * FEE_RATE
    net = amount * (1 - FEE_RATE)

    try:
        async with db.begin():
            market = await markets_repo.get_market_status_row(db, market_id)
            if not market:
                raise HTTPException(status_code=404, detail="Market not found")
            if market.get("status") != "open":
                raise HTTPException(status_code=400, detail="Market is not open")
            await markets_repo.insert_position_simple(db, user_id, market_id, side, amount)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating market trade: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create trade")

    return {"ok": True, "capped": True, "gross": amount, "fee": fee, "net": net}

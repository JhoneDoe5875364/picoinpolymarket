import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
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
async def list_opened_markets(db: DbSession):
    rows = await markets_repo.list_opened_markets(db)
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/{market_id:uuid}", summary="Get market by id")
async def get_market_by_id(market_id: uuid.UUID, db: DbSession):
    row = await markets_repo.get_market_by_id(db, market_id)
    if not row:
        raise HTTPException(status_code=404, detail="Market not found")
    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/resolved", summary="List Markets")
async def list_resolved_markets(db: DbSession):
    rows = await markets_repo.list_resolved_markets(db)
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/leaderboard")
async def get_leaderboard(db: DbSession, limit: int = 50):
    rows = await markets_repo.leaderboard(db, limit)
    return {"ok": True, "items": jsonable_encoder(rows)}


@router.get("/{market_id:uuid}", summary="Get Market Detail")
async def get_market_detail(market_id: uuid.UUID, db: DbSession):
    row = await markets_repo.get_market_snapshot(db, market_id)
    if not row:
        raise HTTPException(status_code=404, detail="Market not found")

    total_volume = row.get("total_volume") or 0
    yes_volume = row.get("yes_volume") or 0
    no_volume = row.get("no_volume") or 0
    yes_pct = row.get("yes_pct") or 0
    no_pct = row.get("no_pct") or 0
    yes_price = yes_pct / 100 if yes_pct > 0 else 0
    no_price = no_pct / 100 if no_pct > 0 else 0

    traders = await markets_repo.count_traders(db, market_id)

    return {
        "ok": True,
        "data": {
            "id": row.get("id"),
            "title": row.get("title"),
            "description": row.get("description"),
            "created_at": row.get("created_at"),
            "end_date": row.get("end_date"),
            "resolved_at": row.get("resolved_at"),
            "status": row.get("status"),
            "category": row.get("category"),
            "total_volume": total_volume,
            "yes_volume": yes_volume,
            "no_volume": no_volume,
            "yes_price": yes_price,
            "no_price": no_price,
            "yes_pct": yes_pct,
            "no_pct": no_pct,
            "traders": traders,
        },
    }


@router.get("/{market_id:uuid}/price-history")
async def get_market_price_history(market_id: uuid.UUID, db: DbSession):
    rows = await markets_repo.market_price_history(db, market_id)
    return {"ok": True, "data": jsonable_encoder(rows or [])}


@router.get("/{market_id:uuid}/recent-trades")
async def get_recent_trades(market_id: uuid.UUID, db: DbSession, limit: int = 50):
    rows = await markets_repo.recent_trades(db, market_id, limit)
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.post("/{market_id:uuid}/trade")
async def create_market_trade(
    market_id: uuid.UUID,
    request: Request,
    db: DbSession,
    user=Depends(verify_token),
):
    user_id = user.get("sub", "")
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

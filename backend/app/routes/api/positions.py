from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select

from app.core.logger import get_logger
from app.core.market import insert_market_trade, update_market_position, update_market_price
from app.core.security import verify_token
from app.core.trade import (
    compute_trade_breakdown,
    validate_breakdown_fields,
    validate_price_match,
)
from app.db.deps import DbSession
from app.models.tables.market import Market
from app.models.tables.market_token import MarketToken
from app.repositories import positions as positions_repo

logger = get_logger()

router = APIRouter(prefix="/positions", tags=["positions"])


def validate_user(user: dict) -> int:
    raw = user.get("sub")
    if raw is None or raw == "":
        logger.error("[CREATE POSITION]: No user_id found")
        raise HTTPException(status_code=401, detail="Unauthorized: No user_id found")
    try:
        return int(raw)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401, detail="Unauthorized: invalid user id in token"
        )


def normalize_side(raw_side: str) -> tuple[str, str]:
    side = str(raw_side or "").strip().lower()
    if side in ("yes", "y"):
        return "yes", "YES"
    if side in ("no", "n"):
        return "no", "NO"
    raise HTTPException(status_code=400, detail="side must be 'yes' or 'no'")


async def get_market_token_price(
    db: DbSession, market_id: int, outcome: str
) -> float:
    market_row = await db.execute(
        select(Market.status).where(Market.id == market_id)
    )
    status = market_row.scalar_one_or_none()
    if status is None:
        raise HTTPException(status_code=404, detail="Market not found")
    if status != "open":
        raise HTTPException(status_code=400, detail="Market is not open")

    token_row = await db.execute(
        select(MarketToken.price).where(
            MarketToken.market_id == market_id,
            MarketToken.outcome == outcome,
        )
    )
    price = token_row.scalar_one_or_none()
    if price is None:
        raise HTTPException(status_code=400, detail="Missing market prices")
    server_price = float(price)
    if server_price <= 0:
        raise HTTPException(status_code=400, detail="Invalid market prices")
    return server_price


@router.post("/")
async def create_position(request: Request, db: DbSession, user=Depends(verify_token)):
    user_id = validate_user(user)
    try:
        data = await request.json()
    except Exception as e:
        logger.error("[CREATE POSITION]: Failed to parse JSON: %s", e)
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    market_id = data.get("market_id")
    if market_id is None:
        raise HTTPException(status_code=400, detail="market_id is required")
    try:
        market_id = int(market_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="market_id must be an integer")

    side_lower, outcome_upper = normalize_side(data.get("side", ""))

    shares_raw = data.get("shares")
    legacy_amount_as_shares = False
    if shares_raw is None:
        shares_raw = data.get("amount")
        legacy_amount_as_shares = shares_raw is not None
    price_raw = data.get("price")
    if shares_raw is None:
        raise HTTPException(status_code=400, detail="shares is required")
    if price_raw is None:
        raise HTTPException(status_code=400, detail="price is required")

    try:
        shares = float(shares_raw)
        client_price = float(price_raw)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="shares and price must be valid numbers")
    if shares <= 0:
        raise HTTPException(status_code=400, detail="shares must be greater than 0")
    if client_price <= 0:
        raise HTTPException(status_code=400, detail="price must be greater than 0")

    client_amount = None if legacy_amount_as_shares else data.get("amount")
    client_fee = data.get("fee")
    client_total_cost = data.get("total_cost")

    try:
        server_price = await get_market_token_price(db, market_id, outcome_upper)
        validate_price_match(client_price, server_price)

        breakdown = compute_trade_breakdown(server_price, shares)
        validate_breakdown_fields(
            amount=client_amount,
            fee=client_fee,
            total_cost=client_total_cost,
            breakdown=breakdown,
        )

        created_at = datetime.now(timezone.utc)
        async with db.begin():
            trade = await insert_market_trade(
                db,
                user_id,
                market_id,
                outcome_upper,
                breakdown.shares,
                created_at,
            )
            await update_market_position(db, trade)
            await update_market_price(db, trade)

            position_row = await positions_repo.get_market_position_snapshot(
                db,
                market_id=market_id,
                user_id=user_id,
                outcome=outcome_upper,
            )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except LookupError:
        raise HTTPException(status_code=404, detail="Market not found")
    except Exception as e:
        logger.error("[CREATE POSITION]: Error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create position") from e

    return {
        "ok": True,
        **breakdown.as_dict(),
        "position": position_row,
    }

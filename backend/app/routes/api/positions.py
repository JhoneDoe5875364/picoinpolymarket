from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import Config
from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import positions as positions_repo

logger = get_logger()

router = APIRouter(prefix="/positions", tags=["positions"])

try:
    FEE_RATE = float(Config.FEE_RATE)
except Exception:
    FEE_RATE = 0.02


def validate_user(user: dict) -> str:
    user_id = user.get("sub")
    if not user_id:
        logger.error("[CREATE POSITION]: No user_id found")
        raise HTTPException(status_code=401, detail="Unauthorized: No user_id found")
    return user_id


def validate_input(data: dict) -> tuple[str, str, float]:
    market_id = data.get("market_id")
    side = data.get("side")
    pi_amount = data.get("amount")
    if not market_id:
        raise HTTPException(status_code=400, detail="market_id is required")
    if side not in ("yes", "no"):
        raise HTTPException(status_code=400, detail="side must be 'yes' or 'no'")
    try:
        pi_amount = float(pi_amount)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="amount must be a valid number")
    if pi_amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than 0")
    return market_id, side, pi_amount


def calculate_position(
    side: str, net_amount: float, yes_price: float, no_price: float
) -> tuple[float, str]:
    price = yes_price if side == "yes" else no_price
    if price <= 0:
        raise HTTPException(status_code=400, detail="Cannot buy at price 0")
    buy_units = net_amount / price
    tx_type = f"prediction-{side}"
    return buy_units, tx_type


@router.post("/")
async def create_position(request: Request, db: DbSession, user=Depends(verify_token)):
    user_id = validate_user(user)
    try:
        data = await request.json()
    except Exception as e:
        logger.error("[CREATE POSITION]: Failed to parse JSON: %s", e)
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    market_id, side, pi_amount = validate_input(data)
    net_amount = pi_amount * (1 - FEE_RATE)
    fee_amount = pi_amount * FEE_RATE

    try:
        async with db.begin():
            market_info = await positions_repo.get_market_snapshot_prices(db, market_id)
            buy_units, tx_type = calculate_position(
                side, net_amount, market_info["yes_price"], market_info["no_price"]
            )
            position_row = await positions_repo.insert_position_with_tx(
                db,
                user_id=user_id,
                market_id=market_id,
                side=side,
                buy_units=buy_units,
                pi_amount=pi_amount,
                tx_type=tx_type,
                market_title=market_info["title"],
            )
    except HTTPException:
        raise
    except LookupError:
        raise HTTPException(status_code=404, detail="Market not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("[CREATE POSITION]: Error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create position")

    return {
        "ok": True,
        "gross": pi_amount,
        "fee": fee_amount,
        "net": net_amount,
        "position": position_row,
    }

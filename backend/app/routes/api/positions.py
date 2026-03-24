from fastapi import APIRouter, Request, HTTPException, Depends
from psycopg2.extras import RealDictCursor
from app.core.security import verify_token
from app.core.database import _conn
from app.core.logger import get_logger
from app.core.config import Config

logger = get_logger()

router = APIRouter(prefix="/positions", tags=["positions"])

try:
    FEE_RATE = float(Config.FEE_RATE)
except Exception:
    FEE_RATE = 0.02  # fallback


def validate_user(user: dict) -> str:
    """Validate and extract user_id from token"""
    user_id = user.get("sub")
    if not user_id:
        logger.error("[CREATE POSITION]: No user_id found")
        raise HTTPException(status_code=401, detail="Unauthorized: No user_id found")
    return user_id


def validate_input(data: dict) -> tuple[str, str, float]:
    """Validate and extract input parameters"""
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


def get_market_info(cur, market_id: str) -> dict:
    """Fetch and validate market information"""
    cur.execute("""
        SELECT id, title, yes_pct, no_pct, status
        FROM v_market_snapshots
        WHERE id = %s
    """, (str(market_id),))
    market_row = cur.fetchone()

    if not market_row:
        raise HTTPException(status_code=404, detail="Market not found")

    if market_row.get('status') != 'open':
        raise HTTPException(status_code=400, detail="Market is not open")

    if market_row['yes_pct'] is None or market_row['no_pct'] is None:
        raise HTTPException(status_code=400, detail="Missing market prices")

    # Convert Decimal to float to avoid type mismatch errors
    yes_price = float(market_row['yes_pct']) / 100.0
    no_price = float(market_row['no_pct']) / 100.0

    if yes_price <= 0 or no_price <= 0:
        raise HTTPException(status_code=400, detail="Invalid market prices")

    return {
        'id': market_row['id'],
        'title': market_row.get('title', ''),
        'yes_price': yes_price,
        'no_price': no_price
    }


def calculate_position(side: str, net_amount: float, yes_price: float, no_price: float) -> tuple[float, str]:
    """Calculate buy units and transaction type"""
    price = yes_price if side == "yes" else no_price
    
    if price <= 0:
        raise HTTPException(status_code=400, detail="Cannot buy at price 0")
    
    buy_units = net_amount / price
    tx_type = f"prediction-{side}"
    
    return buy_units, tx_type


@router.post("/")
async def create_position(request: Request, user=Depends(verify_token)):
    user_id = validate_user(user)
    
    try:
        data = await request.json()
    except Exception as e:
        logger.error(f"[CREATE POSITION]: Failed to parse JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    market_id, side, pi_amount = validate_input(data)
    
    logger.info(f"[CREATE POSITION]: user_id={user_id}, market_id={market_id}, side={side}, pi_amount={pi_amount}")

    net_amount = pi_amount * (1 - FEE_RATE)
    fee_amount = pi_amount * FEE_RATE

    with _conn() as conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                market_info = get_market_info(cur, market_id)
                buy_units, tx_type = calculate_position(side, net_amount, market_info['yes_price'], market_info['no_price'])

                # Insert position
                cur.execute("""
                    INSERT INTO positions (user_id, market_id, side, amount, pi_amount, created_at) 
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    RETURNING *;
                """, (user_id, market_id, side, buy_units, pi_amount))
                position_row = cur.fetchone()

                if not position_row:
                    raise HTTPException(status_code=500, detail="Failed to create position")

                # Insert transaction
                cur.execute("""
                    INSERT INTO transactions (user_id, market_id, amount, pi_amount, type, status, details, date)
                    VALUES (%s, %s, %s, %s, %s, 'completed', %s, CURRENT_DATE)
                """, (user_id, market_id, buy_units, -pi_amount, tx_type, market_info['title']))

            conn.commit()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            logger.error(f"[CREATE POSITION]: Error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create position")

    return {
        "ok": True,
        "gross": pi_amount,
        "fee": fee_amount,
        "net": net_amount,
        "position": position_row
    }

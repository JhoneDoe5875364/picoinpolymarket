# Minimal stub to restore API importability and ensure mount works.
import jwt
import os
import httpx
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from psycopg2.extras import RealDictCursor
from app.core.security import verify_token
from app.core.database import _conn
from app.core.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/open-positions")
async def get_open_positions(request: Request, user=Depends(verify_token)):
    user_id = user.get("sub", "")

    # calc inplay balance
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT position_id, market_id, market_title, side, amount, status
            FROM v_portfolio_open_markets
            WHERE status='open' AND user_id = %s 
        """, (str(user_id),))
        rows = cur.fetchall()

    return {
        "ok": True,
        "rows": jsonable_encoder(rows)
    }


@router.get("/info")
async def get_user_info(request: Request, user=Depends(verify_token)):
    user_id = user.get("sub", "")

    role = user.get("role", "")

    # get user info
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, pi_username, created_at, referral_code, referred_by
            FROM users
            WHERE id = %s 
        """, (str(user_id),))
        user_row = cur.fetchone()

    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "ok": True,
        "info": {
            "id": user_row.get("id"),
            "pi_username": user_row.get("pi_username"),
            "created_at": user_row.get("created_at"),
            "referral_code": user_row.get("referral_code"),
            "referred_by": user_row.get("referred_by"),
            "role": role
        }
    }


@router.get("/recent-activity")
async def get_recent_activity(request: Request, user=Depends(verify_token)):
    user_id = user.get("sub", "")

    # calc recent history
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT position_id, market_id, market_title, side, amount, status, created_at AS date, resolved_outcome AS outcome
            FROM v_portfolio_open_markets
            WHERE user_id = %s 
            LIMIT 10
        """, (str(user_id),))
        rows = cur.fetchall()

    return {
        "ok": True,
        "rows": jsonable_encoder(rows)
    }


@router.get("/history")
async def get_history(request: Request, user=Depends(verify_token)):
    user_id = user.get("sub", "")

    # calc inplay balance
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, date, type, status, amount, pi_amount, details
            FROM transactions
            WHERE user_id = %s 
        """, (str(user_id),))
        rows = cur.fetchall()

    return {
        "ok": True,
        "rows": jsonable_encoder(rows)
    }


@router.post("/claim")
async def handle_claim(user=Depends(verify_token)):
    user_id = user.get("sub", "")

    # Use single transaction for atomicity
    with _conn() as conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # calc total balance
                cur.execute("""
                    SELECT id, balance
                    FROM users
                    WHERE id = %s 
                """, (str(user_id),))
                row = cur.fetchone()

                if not row:
                    raise HTTPException(status_code=404, detail="User not found")
                
                total_balance = row['balance'] or 0

                # calc claimable payouts
                cur.execute("""
                    SELECT SUM(unclaimed_pi) AS balance
                    FROM v_portfolio_unclaimed
                    WHERE user_id = %s
                """, (user_id,))
                row = cur.fetchone()

                claimable_balance = (row['balance'] or 0) if row else 0

                if claimable_balance <= 0:
                    return {
                        "ok": True,
                        "total_balance": total_balance,
                        "claimed_rewards": 0,
                        "claimable_balance": 0
                    }

                # Mark trades as invalid (claimed)
                cur.execute("""
                    UPDATE trades
                    SET invalid = 't'
                    WHERE user_id = %s
                """, (user_id,))

                # Insert transaction record
                cur.execute("""
                    INSERT INTO transactions (user_id, market_id, amount, pi_amount, type, status, details, date)
                    VALUES (%s, null, %s, %s, 'claim-payouts', 'completed', 'Claim All Payouts', CURRENT_DATE)
                    RETURNING *
                """, (user_id, claimable_balance, claimable_balance,))
                inserted_row = cur.fetchone()

                if not inserted_row:
                    raise HTTPException(status_code=500, detail="Failed to create transaction")

                # Update user balance
                new_balance = total_balance + claimable_balance
                cur.execute("""
                    UPDATE users
                    SET balance = %s
                    WHERE id = %s
                    RETURNING balance;
                """, (new_balance, user_id,))

                updated_row = cur.fetchone()
                
                if not updated_row:
                    raise HTTPException(status_code=500, detail="Failed to update user balance")
                
                total_balance = updated_row['balance'] or 0

            conn.commit()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            logger.error(f"Error claiming payouts: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to claim payouts")

    # ✅ Return updated market info
    return {
        "ok": True,
        "total_balance": total_balance,
        "claimed_rewards": claimable_balance,
        "claimable_balance": 0
    }

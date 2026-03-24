import sys
import os
import uuid
from typing import List, Dict, Any
from fastapi import HTTPException, Request, Response, Depends
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from psycopg2.extras import RealDictCursor
from app.core.security import verify_token
from app.core.database import _conn
from app.core.logger import get_logger
from app.core.config import Config

logger = get_logger()

router = APIRouter(prefix="/markets", tags=["markets"])

FEE_RATE = Config.FEE_RATE


@router.get("/", summary="List Markets")
def list_opened_markets():
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, title, created_at, end_date, status, category, total_volume, yes_volume, no_volume, yes_pct, no_pct
            FROM v_market_snapshots
            WHERE status = 'open'
            ORDER BY created_at DESC
            LIMIT 500
        """)
        rows = cur.fetchall()
    return {
        "ok": True,
        "data": jsonable_encoder(rows)
    }


@router.get("/resolved", summary="List Markets")
def list_resolved_markets():
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, title, created_at, end_date, status, category, total_volume, yes_volume, no_volume, yes_pct, no_pct
            FROM v_market_snapshots
            WHERE status = 'resolved'
            ORDER BY created_at DESC
            LIMIT 500
        """)
        rows = cur.fetchall()
    return {
        "ok": True,
        "data": jsonable_encoder(rows)
    }


@router.get("/{market_id:uuid}", summary="Get Market Detail")
def get_market_detail(market_id: uuid.UUID):
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, title, description, created_at, end_date, resolved_at, status, category, total_volume, yes_volume, no_volume, yes_pct, no_pct
            FROM v_market_snapshots
            WHERE id = %s
        """, (str(market_id),))
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Market not found")

    total_volume = row.get("total_volume") or 0
    yes_volume = row.get("yes_volume") or 0
    no_volume = row.get("no_volume") or 0

    yes_pct = row.get("yes_pct") or 0
    no_pct = row.get("no_pct") or 0

    yes_price = yes_pct / 100 if yes_pct > 0 else 0
    no_price = no_pct / 100 if no_pct > 0 else 0

    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT COUNT(*) AS traders
            FROM trades
            WHERE market_id = %s
        """, (str(market_id),))
        row2 = cur.fetchone()

    traders = row2.get("traders", 0) if row2 else 0

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
        }
    }


@router.get("/{market_id:uuid}/price-history")
async def get_market_price_history(market_id: uuid.UUID):
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT ts_date AS date, yes_pct AS probability
              FROM market_price_history
             WHERE market_id = %s
             ORDER BY date ASC
            """,
            (str(market_id),),
        )
        rows = cur.fetchall()
        if not rows:
            rows = []
    return {
        "ok": True,
        "data": jsonable_encoder(rows)
    }


@router.get("/{market_id:uuid}/recent-trades")
async def get_recent_trades(market_id: uuid.UUID, limit: int = 50):
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT 
                t.id,
                t.user_id,
                u.pi_username,
                t.type,
                t.side,
                t.pi_amount,
                t.created_at
            FROM trades t
            JOIN users u ON t.user_id = u.id
            WHERE t.market_id = %s
            ORDER BY t.created_at DESC
            LIMIT %s;
            """,
            (str(market_id), limit,),
        )
        rows = cur.fetchall()

    return {
        "ok": True,
        "data": jsonable_encoder(rows)
    }


@router.post("/{market_id:uuid}/trade")
async def create_market_trade(market_id: uuid.UUID, request: Request, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    data = await request.json()
    side = data.get("side")
    amount = data.get("amount")

    # Input validation
    if side not in ['yes', 'no']:
        raise HTTPException(status_code=400, detail="side must be 'yes' or 'no'")
    
    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than 0")

    fee = amount * FEE_RATE
    net = amount * (1 - FEE_RATE)

    with _conn() as conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Check if market exists and is open
                cur.execute("""
                    SELECT id, status
                    FROM markets
                    WHERE id = %s
                """, (str(market_id),))
                market = cur.fetchone()
                
                if not market:
                    raise HTTPException(status_code=404, detail="Market not found")
                
                if market.get('status') != 'open':
                    raise HTTPException(status_code=400, detail="Market is not open")

                cur.execute(
                    """
                    INSERT INTO positions (user_id, market_id, side, amount, created_at) 
                    VALUES (%s, %s, %s, %s, NOW())
                    RETURNING *;
                    """,
                    (user_id, str(market_id), side, amount),
                )
                position_row = cur.fetchone()
                
                if not position_row:
                    raise HTTPException(status_code=500, detail="Failed to create position")
            conn.commit()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            logger.error(f"Error creating market trade: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create trade")

    return {
        "ok": True,
        "capped": True,
        "gross": amount,
        "fee": fee,
        "net": net
    }


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                RANK() OVER (ORDER BY volume DESC) AS rank,
                user_id, username, volume, success_pct AS accuracy
            FROM v_leaderboard
            ORDER BY volume DESC
            LIMIT %s
        """, (limit,))
        rows = cur.fetchall()

    return {
        "ok": True,
        "items": jsonable_encoder(rows)
    }

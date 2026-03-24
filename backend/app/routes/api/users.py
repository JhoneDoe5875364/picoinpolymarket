# Minimal stub to restore API importability and ensure mount works.
import jwt
import os
import uuid
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from app.core.security import verify_token
from app.core.database import _conn
from app.core.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
async def get_users(
    request: Request,
    page: int = 1,
    limit: int = 50,
    sort_by: str = "created_at",
    order: str = "desc",
    search: str = "",
):
    """
    List users, supporting pagination, sorting, and searching.
    """
    page = max(1, int(page))
    limit = max(1, min(200, int(limit)))
    offset = (page - 1) * limit

    # Whitelist for sort_by and order
    sort_by_columns = {"pi_username", "created_at", "status", "balance"}
    if sort_by not in sort_by_columns:
        sort_by = "created_at"
    if order.lower() not in ("asc", "desc"):
        order = "desc"
    else:
        order = order.lower()

    params = []
    where_sql = ""

    # Search by pi_username (case-insensitive partial match)
    if search:
        where_sql = "WHERE pi_username ILIKE %s"
        params.append(f"%{search}%")

    # Main query for paginated user rows
    query = f"""
        SELECT id, pi_username, status, balance, created_at
        FROM users
        {where_sql}
        ORDER BY {sort_by} {order}
        LIMIT %s OFFSET %s
    """
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, (*params, limit, offset))
        rows = cur.fetchall()

    # Count query for total users (with same filter)
    count_query = f"""
        SELECT COUNT(*) AS total
        FROM users
        {where_sql}
    """
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(count_query, params)
        total = cur.fetchone()["total"] or 0

    return {
        "ok": True,
        "data": jsonable_encoder(rows),
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/balance")
async def get_balance(request: Request, user=Depends(verify_token)):
    user_id = user.get("sub", "")

    in_play_balance = 0

    # calc inplay balance
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT SUM(pi_amount) as balance
            FROM v_portfolio_open_markets
            WHERE status='open' AND user_id = %s 
        """, (str(user_id),))
        row = cur.fetchone()

        if row is not None and row['balance'] is not None:
            in_play_balance = row['balance'] or 0

    return {
        "ok": True,
        "in_play_balance": in_play_balance
    }


@router.post("/status")
async def update_user_status(request: Request, user=Depends(verify_token)):
    user_id = user.get("sub", "")

    # check superadmin
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="HasNotSuperadminRole"
        )
    
    data = await request.json()
    user_id = data.get("user_id")
    status = data.get("status")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    if not status:
        raise HTTPException(status_code=400, detail="status is required")

    with _conn() as conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    UPDATE users
                       SET status = %s
                     WHERE id = %s
                     RETURNING id, pi_username, status, balance, created_at;
                    """,
                    (status, user_id,),
                )

                user_row = cur.fetchone()
                
                if not user_row:
                    raise HTTPException(status_code=404, detail="User not found")
            conn.commit()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            logger.error(f"Error updating user status: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update user status")

    return {
        "ok": True,
        "user": jsonable_encoder(user_row)
    }

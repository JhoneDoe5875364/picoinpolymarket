# Minimal stub to restore API importability and ensure mount works.
from fastapi import APIRouter, Request, Depends, Query, Path, Body, HTTPException
from fastapi.encoders import jsonable_encoder
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from math import ceil
from pydantic import BaseModel
from typing import Optional
import pytz
from app.core.security import verify_token
from app.core.database import _conn
from app.core.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/admin", tags=["admin"])


class ResolveMarketRequest(BaseModel):
    outcome: str  # e.g., 'yes', 'no', 'cancelled'


@router.post("/markets")
async def create_market(request: Request, user=Depends(verify_token)):
    user_id = user.get("sub", "")

    # check superadmin
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="HasNotSuperadminRole"
        )

    data = await request.json()
    question = data.get("question")
    description = data.get("description")
    category = data.get("category")
    
    resolution_date_str = data.get("resolution_date_str")  # Date string (YYYY-MM-DD)
    resolution_time_str = data.get("resolution_time_str")  # Time string (HH:MM, HH:MM:SS)
    timezone_str = data.get("timezone")  # Timezone string (e.g., "America/New_York", "UTC", "Asia/Seoul")
    
    checklist_resolution_clarity = data.get("checklist_resolution_clarity")
    checklist_restricted_topics = data.get("checklist_restricted_topics")

    # Parse resolution date/time
    resolution_dt = None
    
    if resolution_date_str:
        # New format: date + time + timezone
        try:
            # Parse date
            date_part = datetime.strptime(resolution_date_str, "%Y-%m-%d").date()
            
            # Parse time (default to 00:00:00 if not provided)
            if resolution_time_str:
                # Try HH:MM:SS format first
                try:
                    time_part = datetime.strptime(resolution_time_str, "%H:%M:%S").time()
                except ValueError:
                    # If that fails, try HH:MM format and append :00
                    try:
                        time_part = datetime.strptime(resolution_time_str + ":00", "%H:%M:%S").time()
                    except ValueError:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid time format: {resolution_time_str}. Expected HH:MM or HH:MM:SS"
                        )
            else:
                time_part = datetime.min.time()
            
            # Combine date and time
            naive_dt = datetime.combine(date_part, time_part)
            
            # Apply timezone
            if timezone_str:
                try:
                    tz = pytz.timezone(timezone_str)
                    resolution_dt = tz.localize(naive_dt)
                    # Convert to UTC for storage
                    resolution_dt = resolution_dt.astimezone(pytz.UTC)
                except pytz.exceptions.UnknownTimeZoneError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unknown timezone: {timezone_str}. Use IANA timezone names (e.g., 'America/New_York', 'UTC', 'Asia/Seoul')"
                    )
            else:
                # Default to UTC if no timezone provided
                resolution_dt = pytz.UTC.localize(naive_dt)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date/time format. Date: YYYY-MM-DD, Time: HH:MM:SS. Error: {str(e)}"
            )
    
    if not resolution_dt:
        raise HTTPException(
            status_code=400,
            detail="Either 'resolution_date' (ISO 8601) or 'resolution_date_str' with optional 'resolution_time_str' and 'timezone' must be provided"
        )

    end_date = resolution_dt - timedelta(days=1)
    clarity_flag = 't' if checklist_resolution_clarity else 'f'
    restricted_flag = 't' if checklist_restricted_topics else 'f'

    with _conn() as conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Store resolution_date in UTC
                resolution_date_utc = resolution_dt.replace(tzinfo=None) if resolution_dt.tzinfo else resolution_dt
                
                cur.execute("""
                    INSERT INTO markets (question, category, description, end_date, close_at, status, checklist_resolution_clarity, checklist_restricted_topics) 
                    VALUES (%s, %s, %s, %s, %s, 'open', %s, %s)
                    RETURNING *;
                """, (question, category, description, end_date.replace(tzinfo=None), resolution_date_utc, clarity_flag, restricted_flag))
                market_row = cur.fetchone()
                
                if not market_row:
                    raise HTTPException(status_code=500, detail="Failed to create market")
            conn.commit()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            logger.error(f"Error creating market: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create market")

    return {
        "ok": True,
        "market": jsonable_encoder(market_row)
    }


@router.get("/markets")
async def get_markets(
    page: int = Query(1, ge=1, description="Page number (default 1)"),
    limit: int = Query(
        20, ge=1, le=100, description="Number of results per page (default 20)"),
    sort_by: str = Query("created_at", description="Sort column name"),
    order: str = Query("desc", description="Sort order (asc or desc)"),
    search: str = Query("", description="Search keyword"),
    status: str = Query(
        None, description="Market status (open, closed, resolved, etc.)"),
    user=Depends(verify_token)
):
    user_id = user.get("sub", "")

    # check admin
    role = user.get("role", "")
    if role != "superadmin" and role != "admin":
        raise HTTPException(
            status_code=403,
            detail="HasNotAdminRole"
        )

    # Safe column filtering (SQL injection prevention)
    allowed_sort_columns = {"created_at", "question", "status",
                            "end_date"}
    if sort_by not in allowed_sort_columns:
        sort_by = "created_at"

    order = order.lower()
    if order not in ["asc", "desc"]:
        order = "desc"

    where_clauses = []
    params = []

    if search:
        where_clauses.append("(question ILIKE %s OR description ILIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])

    if status and status.lower() != "all":
        where_clauses.append("status = %s")
        params.append(status)

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    offset = (page - 1) * limit

    # Find total count
    # Note: Using f-string for dynamic SQL, but sort_by and order are validated against whitelist
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        count_query = f"""
            SELECT COUNT(*) AS total
            FROM v_market_snapshots
            {where_sql}
        """
        cur.execute(count_query, params)
        count_result = cur.fetchone()
        total = count_result["total"] if count_result else 0

        query = f"""
            SELECT 
                id AS id,
                status AS status,
                title AS title,
                category AS category,
                created_at AS created_at,
                end_date AS end_date,
                COALESCE(total_pi, 0) AS total_pi,
                COALESCE(total_participants, 0) AS total_participants,
                COALESCE(total_volume, 0) AS total_volume,
                COALESCE(yes_volume, 0) AS yes_volume,
                COALESCE(no_volume, 0) AS no_volume,
                COALESCE(volume_24h, 0) AS volume_24h
            FROM v_market_snapshots
            {where_sql}
            ORDER BY {sort_by} {order}
            LIMIT %s OFFSET %s
        """
        cur.execute(query, (*params, limit, offset))
        rows = cur.fetchall()

    return {
        "ok": True,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": ceil(total / limit) if total else 0,
        "data": rows
    }


@router.get("/resolutions")
async def get_resolutions(
    page: int = Query(1, ge=1, description="Page number (default 1)"),
    limit: int = Query(25, ge=1, le=100, description="Number of results per page (default 25)"),
    sort_by: str = Query("resolved_at", description="Sort column name"),
    order: str = Query("desc", description="Sort order (asc or desc)"),
    search: str = Query("", description="Search keyword"),
    user=Depends(verify_token)
):
    """
    Get resolved markets with resolution details.
    Returns: final outcome, when resolved, who resolved, payout status.
    """
    user_id = user.get("sub", "")

    # check admin
    role = user.get("role", "")
    if role != "superadmin" and role != "admin":
        raise HTTPException(
            status_code=403,
            detail="HasNotAdminRole"
        )

    # Safe column filtering (SQL injection prevention)
    allowed_sort_columns = {
        "resolved_at", "resolved_outcome", "title", "created_at", 
        "total_volume", "resolved_by_username", "payout_status"
    }
    if sort_by not in allowed_sort_columns:
        sort_by = "resolved_at"

    order = order.lower()
    if order not in ["asc", "desc"]:
        order = "desc"

    where_clauses = ["m.status = 'resolved'", "m.resolved = true"]
    params = []

    if search:
        where_clauses.append("(m.question ILIKE %s OR m.description ILIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])

    where_sql = "WHERE " + " AND ".join(where_clauses)
    offset = (page - 1) * limit

    # Find total count
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        count_query = f"""
            SELECT COUNT(*) AS total
            FROM markets m
            {where_sql}
        """
        cur.execute(count_query, params)
        count_result = cur.fetchone()
        total = count_result["total"] if count_result else 0

        # Query resolved markets with all necessary fields
        # total_volume is calculated from trades table
        query = f"""
            SELECT 
                m.id AS id,
                m.title AS title,
                m.description AS description,
                m.category AS category,
                m.created_at AS created_at,
                m.resolved_at AS resolved_at,
                m.resolved_by_username AS resolved_by_username,
                m.resolved_outcome AS resolved_outcome,
                m.payout_status AS payout_status,
                COALESCE((
                    SELECT SUM(t.pi_amount) 
                    FROM trades t
                    WHERE t.market_id = m.id AND COALESCE(t.invalid, false) = false
                ), 0) AS total_volume,
                m.status AS status
            FROM markets m
            {where_sql}
            ORDER BY {sort_by} {order}
            LIMIT %s OFFSET %s
        """
        cur.execute(query, (*params, limit, offset))
        rows = cur.fetchall()

    return {
        "ok": True,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": ceil(total / limit) if total else 0,
        "data": rows
    }


@router.post("/markets/{market_id}/resolve/{outcome}")
async def resolve_market(
    market_id: str = Path(..., description="Market ID to resolve"),
    outcome: str = Path(..., description="Outcome"),
    user=Depends(verify_token)
):
    user_id = user.get("sub", "")
    username = user.get("username", "")

    # check superadmin
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="HasNotSuperadminRole"
        )
    
    # Simple validation
    allowed_outcomes = {"yes", "no"}
    if outcome not in allowed_outcomes:
        raise HTTPException(status_code=400, detail="Invalid outcome value")

    # Use single transaction for atomicity
    with _conn() as conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    UPDATE markets
                    SET resolved_outcome = %s,
                        resolved_at = NOW(),
                        resolved = 't',
                        resolved_by_user_id = %s,
                        resolved_by_username = %s,
                        status = 'resolved'
                    WHERE id = %s
                    RETURNING id, question, resolved, resolved_outcome, resolved_at, status;
                """, (outcome, user_id, username, market_id))

                updated_row = cur.fetchone()
                
                if not updated_row:
                    raise HTTPException(status_code=404, detail="Market not found")

                cur.execute("""
                    UPDATE trades
                    SET invalid = 'f'
                    WHERE market_id = %s
                """, (market_id,))
                
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Error resolving market {market_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to resolve market")

    # ✅ Return updated market info
    return {
        "ok": True,
        "data": jsonable_encoder(updated_row)
    }


@router.post("/markets/{market_id}/cancel")
async def cancel_market(
    market_id: str = Path(..., description="Market ID to cancel"),
    user=Depends(verify_token)
):
    user_id = user.get("sub", "")

    # check superadmin
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="HasNotSuperadminRole"
        )
    
    # Use single transaction for atomicity
    with _conn() as conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT *
                    FROM markets m
                    WHERE id = %s
                """, (market_id,))
                market = cur.fetchone()

                if not market:
                    raise HTTPException(status_code=404, detail="MarketNotFound")

                cur.execute("""
                    SELECT user_id, SUM(pi_amount) AS total_amount
                    FROM positions
                    WHERE market_id = %s
                    GROUP BY user_id
                """, (market_id,))
                openPositions = cur.fetchall()

                cur.execute("""
                    UPDATE markets
                    SET status = 'cancelled'
                    WHERE id = %s
                    RETURNING *
                """, (market_id,))
                updatedMarket = cur.fetchone()

                for pos in openPositions:
                    cur.execute("""
                        SELECT id, balance
                        FROM users
                        WHERE id = %s
                    """, (pos['user_id'],))
                    user = cur.fetchone()

                    if not user:
                        logger.warning(f"User {pos['user_id']} not found for refund")
                        continue

                    pi_amount = pos['total_amount'] or 0
                    user_id = user['id']
                    old_balance = user['balance'] or 0
                    new_balance = old_balance + pi_amount

                    # FIXED: Added WHERE clause to prevent updating all users
                    cur.execute("""
                        UPDATE users
                        SET balance = %s
                        WHERE id = %s
                        RETURNING *
                    """, (new_balance, user_id,))
                    updated_user = cur.fetchone()

                    if not updated_user:
                        logger.error(f"Failed to update balance for user {user_id}")
                        continue

                    cur.execute("""
                        INSERT INTO transactions (user_id, market_id, amount, pi_amount, type, status, details, date)
                        VALUES (%s, %s, %s, %s, 'refund', 'completed', 'Refund due to cancellation', CURRENT_DATE)
                        RETURNING *
                    """, (user_id, market_id, pi_amount, pi_amount,))

            conn.commit()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            logger.error(f"Error cancelling market {market_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to cancel market")

    # ✅ Return updated market info
    return {
        "ok": True,
    }


@router.get("/platform_state")
async def get_platform_state(user=Depends(verify_token)):
    """
    Get high-level platform statistics (read-only snapshot).
    Returns: total users, open markets, resolved markets, locked Pi, historical Pi collected.
    """
    user_id = user.get("sub", "")

    # check admin
    role = user.get("role", "")
    if role != "superadmin" and role != "admin":
        raise HTTPException(
            status_code=403,
            detail="HasNotAdminRole"
        )

    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Total users
        cur.execute("SELECT COUNT(*) AS count FROM users")
        total_users = cur.fetchone()["count"] or 0

        # Open markets count
        cur.execute("""
            SELECT COUNT(*) AS count 
            FROM markets 
            WHERE status = 'open'
        """)
        open_markets = cur.fetchone()["count"] or 0

        # Resolved markets count
        cur.execute("""
            SELECT COUNT(*) AS count 
            FROM markets 
            WHERE resolved = true AND status = 'resolved'
        """)
        resolved_markets = cur.fetchone()["count"] or 0

        # Total Pi locked in open markets
        cur.execute("""
            SELECT COALESCE(SUM(total_volume), 0) AS total
            FROM v_market_snapshots
            WHERE status = 'open'
        """)
        locked_pi_result = cur.fetchone()
        locked_pi = float(locked_pi_result["total"] or 0) if locked_pi_result else 0

        # Total Pi collected historically (before fees/payouts)
        # This is the sum of all buy/sell trades (gross amount, not net)
        cur.execute("""
            SELECT COALESCE(SUM(pi_amount), 0) AS total
            FROM trades
            WHERE type IN ('buy', 'sell') 
            AND COALESCE(invalid, false) = false
        """)
        historical_pi_result = cur.fetchone()
        historical_pi = float(historical_pi_result["total"] or 0) if historical_pi_result else 0

    return {
        "ok": True,
        "total_users": total_users,
        "open_markets": open_markets,
        "resolved_markets": resolved_markets,
        "locked_pi": locked_pi,
        "historical_pi": historical_pi
    }

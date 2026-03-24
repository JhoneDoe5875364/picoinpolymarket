from fastapi import APIRouter, HTTPException, Query, Depends, Request
from fastapi.encoders import jsonable_encoder
from psycopg2.extras import RealDictCursor
from datetime import timedelta
from uuid import UUID
from app.core.security import verify_token
from app.core.database import _conn
from app.core.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/suggestions")


@router.get("/", summary="List all market suggestions", operation_id="list_suggestions_public")
def list_suggestions(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    offset = (page - 1) * limit
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT 
                s.id::text AS id,
                s.user_id,
                u.pi_username,
                s.title,
                s.description,
                s.category,
                s.status,
                s.resolution_criteria,
                s.end_time,
                s.created_at
            FROM suggestions s
            LEFT JOIN users u ON u.id = s.user_id
            WHERE s.status = 'pending'
            ORDER BY s.created_at DESC
            OFFSET %s
            LIMIT %s;
            """,
            (offset, limit),
        )
        rows = cur.fetchall()

    with _conn() as conn2, conn2.cursor() as c2:
        c2.execute("SELECT COUNT(*) FROM suggestions")
        total = c2.fetchone()[0]

    return {"items": rows, "page": page, "limit": limit, "total": total}


@router.post("/", summary="Create a market suggestion")
async def create_suggestion(request: Request, user=Depends(verify_token)):
    data = await request.json()
    user_id = user.get("sub", "")

    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO suggestions (
                user_id, title, category, description, resolution_criteria, end_time, status
            ) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
            """, (
                user_id,
                data.get("question"),
                data.get("category"),
                data.get("description"),
                ' ',
                data.get("endDate"),
                'pending',
            ),
        )
        suggestion_row = cur.fetchone()

    conn.commit()

    return {
        "ok": True,
        "suggestion": jsonable_encoder(suggestion_row)
    }


@router.get("/{suggestion_id}", summary="Get one market suggestion", operation_id="get_suggestion_public")
def get_suggestion(suggestion_id: UUID):
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id::text AS id, title, description, category, status, 
                   resolution_criteria, end_time, created_at
              FROM suggestions
             WHERE id = %s
            """,
            (str(suggestion_id),),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Suggestion not found")
    return dict(row)


@router.post("/{suggestion_id}/status/{status}")
async def modify_suggestion_status(
    suggestion_id: UUID,
    status: str,
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
                cur.execute(
                    """
                    SELECT id::text AS id, title, description, category,
                           resolution_criteria, end_time
                      FROM suggestions
                     WHERE id=%s
                    """,
                    (str(suggestion_id),),
                )
                suggestion = cur.fetchone()

                if not suggestion:
                    raise HTTPException(status_code=404, detail="Suggestion not found")

                if not suggestion.get('end_time'):
                    raise HTTPException(status_code=400, detail="Suggestion end_time is missing")

                resolution_date = suggestion['end_time'] + timedelta(days=1)

                cur.execute(
                    """
                    UPDATE suggestions
                       SET status = %s
                     WHERE id = %s
                    """,
                    (status, str(suggestion_id),),
                )

                cur.execute(
                    """
                    INSERT INTO markets (
                        question, category, description, end_date, close_at, status, 
                        checklist_resolution_clarity, checklist_restricted_topics
                    ) 
                    VALUES (%s, %s, %s, %s, %s, 'open', 't', 't')
                    RETURNING *;
                    """, (
                        suggestion["title"],
                        suggestion["category"],
                        suggestion["description"],
                        suggestion["end_time"],
                        resolution_date,
                    ),
                )

                market_row = cur.fetchone()
                
                if not market_row:
                    raise HTTPException(status_code=500, detail="Failed to create market")
            conn.commit()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            logger.error(f"Error modifying suggestion status: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to modify suggestion status")

    return {
        "ok": True,
        "market": jsonable_encoder(market_row)
    }

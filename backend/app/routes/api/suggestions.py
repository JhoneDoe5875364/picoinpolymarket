from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import suggestions as suggestions_repo

logger = get_logger()

router = APIRouter(prefix="/suggestions")


@router.get("/", summary="List all market suggestions", operation_id="list_suggestions_public")
async def list_suggestions(
    db: DbSession, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)
):
    offset = (page - 1) * limit
    rows, total = await suggestions_repo.list_pending_suggestions(
        db, offset=offset, limit=limit
    )
    return {
        "items": jsonable_encoder(rows),
        "page": page,
        "limit": limit,
        "total": total,
    }


@router.post("/", summary="Create a market suggestion")
async def create_suggestion(request: Request, db: DbSession, user=Depends(verify_token)):
    data = await request.json()
    raw_sub = user.get("sub")
    try:
        user_id = int(raw_sub) if raw_sub is not None else None
    except (TypeError, ValueError):
        user_id = None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid user id in token")
    try:
        async with db.begin():
            suggestion_row = await suggestions_repo.insert_suggestion(
                db,
                user_id=user_id,
                title=data.get("question"),
                category=data.get("category"),
                description=data.get("description"),
                end_time=data.get("endDate"),
            )
    except Exception as e:
        logger.error("Error creating suggestion: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create suggestion")

    return {"ok": True, "suggestion": jsonable_encoder(suggestion_row)}


@router.get("/{suggestion_id}", summary="Get one market suggestion", operation_id="get_suggestion_public")
async def get_suggestion(suggestion_id: UUID, db: DbSession):
    row = await suggestions_repo.get_suggestion_public(db, suggestion_id)
    if not row:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return jsonable_encoder(dict(row))


@router.post("/{suggestion_id}/status/{status}")
async def modify_suggestion_status(
    db: DbSession,
    suggestion_id: UUID,
    status: str,
    user=Depends(verify_token),
):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="HasNotSuperadminRole")

    try:
        async with db.begin():
            market_row = await suggestions_repo.approve_suggestion_create_market(
                db, suggestion_id=suggestion_id, status=status
            )
    except LookupError:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error modifying suggestion status: %s", e)
        raise HTTPException(status_code=500, detail="Failed to modify suggestion status")

    return {"ok": True, "market": jsonable_encoder(market_row)}

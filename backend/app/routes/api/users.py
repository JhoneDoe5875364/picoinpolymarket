from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import users as users_repo

logger = get_logger()

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
async def get_users(
    request: Request,
    db: DbSession,
    page: int = 1,
    limit: int = 50,
    sort_by: str = "created_at",
    order: str = "desc",
    search: str = "",
):
    _ = request
    page = max(1, int(page))
    limit = max(1, min(200, int(limit)))
    offset = (page - 1) * limit

    sort_by_columns = {"pi_username", "created_at", "status", "balance"}
    if sort_by not in sort_by_columns:
        sort_by = "created_at"
    order = order.lower() if order.lower() in ("asc", "desc") else "desc"

    rows, total = await users_repo.list_users_page(
        db,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        order=order,
        search=search,
    )
    return {
        "ok": True,
        "data": jsonable_encoder(rows),
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/balance")
async def get_balance(db: DbSession, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    in_play_balance = await users_repo.in_play_balance(db, user_id)
    return {"ok": True, "in_play_balance": in_play_balance}


@router.post("/status")
async def update_user_status(request: Request, db: DbSession, user=Depends(verify_token)):
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="HasNotSuperadminRole")

    data = await request.json()
    target_user_id = data.get("user_id")
    status = data.get("status")
    if not target_user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    if not status:
        raise HTTPException(status_code=400, detail="status is required")

    try:
        async with db.begin():
            user_row = await users_repo.update_user_status(
                db, user_id=target_user_id, status=status
            )
    except LookupError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error("Error updating user status: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update user status")

    return {"ok": True, "user": jsonable_encoder(user_row)}


@router.get("/positions", summary="Get positions by user")
async def get_open_positions(
    db: DbSession,
    user_id: int = Query(..., ge=1),
    status: Optional[str] = Query(default='ALL'),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="shares"),
    sort_direction: str = Query(default="DESC"),
):
    try:
        rows = await users_repo.list_positions(
            db,
            user_id=user_id,
            status=status,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_direction=sort_direction,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "data": jsonable_encoder(rows)}


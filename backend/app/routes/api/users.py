from math import ceil
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
    db: DbSession,
    status: Optional[str] = Query(default="ALL"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="created_at"),
    order: str = Query(default="DESC"),
    search: str = Query(default=""),
):
    if sort_by not in ["pi_username", "created_at", "balance"]:
        raise HTTPException(status_code=400, detail="Invalid sort_by")
    if order not in ["ASC", "DESC"]:
        raise HTTPException(status_code=400, detail="Invalid order")
    if status not in ["ALL", "ACTIVE", "SUSPENDED", "BANNED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    rows, total = await users_repo.get_users(
        db,
        status=status,
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
        "page": ceil(offset / limit) + 1,
        "pages": ceil(total / limit) if total else 0,
    }


@router.get("/positions", summary="Get positions by user")
async def get_open_positions(
    db: DbSession,
    user_id: int = Query(..., ge=1),
    status: Optional[str] = Query(default='ALL'),
    search: str = Query(default=""),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    order: str = Query(default="shares"),
    ascending: bool = Query(default=False),
):
    try:
        rows = await users_repo.list_positions(
            db,
            user_id=user_id,
            status=status,
            search=search,
            limit=limit,
            offset=offset,
            order=order,
            ascending=ascending,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/trades", summary="Get trades by user")
async def get_user_trades(
    db: DbSession,
    user_id: int = Query(..., ge=1),
    search: str = Query(default=""),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    order: str = Query(default="created_at"),
    ascending: bool = Query(default=False),
):
    try:
        rows = await users_repo.list_trades(
            db,
            user_id=user_id,
            search=search,
            limit=limit,
            offset=offset,
            order=order,
            ascending=ascending,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/balance")
async def get_balance(db: DbSession, user=Depends(verify_token)):
    pi_uid = user.get("sub", "")
    balance = await users_repo.get_user_balance_by_uuid(db, pi_uid)
    return {"ok": True, "balance": balance}


@router.post("/status")
async def update_user_status(
    request: Request, 
    db: DbSession, 
    user=Depends(verify_token)
):
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
    if status not in ["ACTIVE", "SUSPENDED", "BANNED"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    user_row = await users_repo.update_user_status(
        db, pi_uid=target_user_id, status=status
    )
    return {"ok": True, "user": jsonable_encoder(user_row)}


from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.encoders import jsonable_encoder

from app.core.admin_audit import log_admin_action
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
    if sort_by not in ["pi_username", "created_at", "status"]:
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


@router.get("/summary")
async def get_users_summary(
    db: DbSession,
    search: str = Query(default=""),
):
    summary = await users_repo.get_users_summary(db, search=search)
    return {"ok": True, "data": summary}


@router.get("/positions", summary="Get positions by user")
async def get_open_positions(
    db: DbSession,
    user_id: int = Query(..., ge=1),
    is_closed: Optional[bool] = Query(default=None),
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
            is_closed=is_closed,
            search=search,
            limit=limit,
            offset=offset,
            order=order,
            ascending=ascending,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/payments", summary="List Pi payment history for a user")
async def get_user_payments(
    db: DbSession,
    user_id: int = Query(..., ge=1),
    status: str = Query(default="ALL"),
    search: str = Query(default=""),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    order: str = Query(default="created_at"),
    ascending: bool = Query(default=False),
    user=Depends(verify_token),
):
    sub = str(user.get("sub", ""))
    role = user.get("role", "")
    if role not in ("admin", "superadmin") and sub != str(user_id):
        raise HTTPException(status_code=403, detail="Cannot access other users' payments")

    try:
        rows, total = await users_repo.list_user_payments(
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

    return {
        "ok": True,
        "data": jsonable_encoder(rows),
        "total": total,
        "page": ceil(offset / limit) + 1 if limit else 1,
        "pages": ceil(total / limit) if total else 0,
    }


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


@router.get("/total-markets-traded", summary="Get total markets a user has traded")
async def get_total_markets_traded(
    db: DbSession,
    user_id: int = Query(..., ge=1),
):
    total = await users_repo.get_total_markets_traded(db, user_id=user_id)
    return {
        "ok": True,
        "data": {
            "user_id": user_id,
            "total_markets_traded": total,
        },
    }


@router.get("/total-positions-value", summary="Get total value of a user's positions")
async def get_total_positions_value(
    db: DbSession,
    user_id: int = Query(..., ge=1),
):
    total_value = await users_repo.get_total_positions_value(db, user_id=user_id)
    return {
        "ok": True,
        "data": {
            "user_id": user_id,
            "total_positions_value": total_value,
        },
    }


@router.get("/pnl", summary="Get profit/loss in a period")
async def get_profit_loss_by_period(
    db: DbSession,
    user_id: int = Query(..., ge=1),
    period: str = Query(default="1D"),
):
    if period not in ["1D", "1W", "1M", "ALL"]:
        raise HTTPException(status_code=400, detail="Invalid period")
    stats = await users_repo.get_profit_loss_by_period(
        db,
        user_id=user_id,
        period=period,
    )
    return {"ok": True, "data": jsonable_encoder(stats)}


@router.get("/pnl-history", summary="Get profit/loss history in a period")
async def get_pnl_history(
    db: DbSession,
    user_id: int = Query(..., ge=1),
    period: str = Query(default="1D"),
):
    if period not in ["1D", "1W", "1M", "ALL"]:
        raise HTTPException(status_code=400, detail="Invalid period")
    history = await users_repo.get_pnl_history(
        db,
        user_id=user_id,
        period=period,
    )
    return {"ok": True, "data": jsonable_encoder(history)}


@router.get("/biggest-win", summary="Get biggest win from resolved markets")
async def get_biggest_win(
    db: DbSession,
    user_id: int = Query(..., ge=1),
):
    biggest_win = await users_repo.get_biggest_win(db, user_id=user_id)
    return {"ok": True, "data": jsonable_encoder(biggest_win)}


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
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    data = await request.json()
    target_user_id_raw = data.get("user_id")
    status = data.get("status")
    if target_user_id_raw is None or str(target_user_id_raw).strip() == "":
        raise HTTPException(status_code=400, detail="user_id is required")
    if not status:
        raise HTTPException(status_code=400, detail="status is required")
    if status not in ["ACTIVE", "SUSPENDED", "BANNED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        target_user_id = int(target_user_id_raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="user_id must be an integer") from None
    if target_user_id < 1:
        raise HTTPException(status_code=400, detail="user_id must be a positive integer")

    try:
        async with db.begin():
            user_row = await users_repo.update_user_status(
                db, user_id=target_user_id, status=status
            )
            action_type = (
                "user_banned"
                if status == "BANNED"
                else "user_suspended"
                if status == "SUSPENDED"
                else "user_status_changed"
            )
            await log_admin_action(
                db,
                request=request,
                admin_user=user,
                action_type=action_type,
                detail=f"Set user #{target_user_id} status to {status}",
                category_key=f"user:{target_user_id}",
            )
    except Exception as exc:
        logger.error("Error updating user %s status: %s", target_user_id, exc)
        raise HTTPException(status_code=500, detail="Failed to update user status") from exc
    return {"ok": True, "user": jsonable_encoder(user_row)}


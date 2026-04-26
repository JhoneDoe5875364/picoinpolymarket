from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import comments as comments_repo

logger = get_logger()

router = APIRouter(prefix="/comments", tags=["comments"])


def _get_user_id(user: dict) -> int:
    raw_sub = user.get("sub")
    try:
        user_id = int(raw_sub) if raw_sub is not None else None
    except (TypeError, ValueError):
        user_id = None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid user id in token")
    return user_id


@router.get("/markets/{market_id:int}", summary="List market comments")
async def list_market_comments(
    db: DbSession,
    market_id: int = Path(..., ge=1),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    include_deleted: bool = Query(default=False),
):
    rows = await comments_repo.list_market_comments(
        db,
        market_id=market_id,
        offset=offset,
        limit=limit,
        include_deleted=include_deleted,
    )
    return {
        "ok": True,
        "items": jsonable_encoder(rows["items"]),
        "offset": offset,
        "limit": limit,
        "total": rows["total"],
    }


@router.get("/markets/{market_id:int}/summary", summary="Get market comment summary")
async def get_market_comment_summary(
    db: DbSession,
    market_id: int = Path(..., ge=1),
):
    row = await comments_repo.get_market_comment_summary(db, market_id)
    return {"ok": True, "data": jsonable_encoder(row)}


@router.post("/markets/{market_id:int}", summary="Create market comment")
async def create_market_comment(
    request: Request,
    db: DbSession,
    market_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    payload = await request.json()
    body = str(payload.get("body") or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="body is required")
    if len(body) > 2000:
        raise HTTPException(status_code=400, detail="body is too long")

    user_id = _get_user_id(user)
    try:
        async with db.begin():
            row = await comments_repo.create_comment(
                db,
                market_id=market_id,
                player_id=user_id,
                body=body,
            )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error creating comment for market %s: %s", market_id, exc)
        raise HTTPException(status_code=500, detail="Failed to create comment") from exc

    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/{comment_id:int}/replies", summary="List replies for comment")
async def list_replies(
    db: DbSession,
    comment_id: int = Path(..., ge=1),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    include_deleted: bool = Query(default=False),
):
    try:
        rows = await comments_repo.list_replies(
            db,
            comment_id=comment_id,
            offset=offset,
            limit=limit,
            include_deleted=include_deleted,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "ok": True,
        "root_comment_id": rows["root_comment_id"],
        "items": jsonable_encoder(rows["items"]),
        "offset": offset,
        "limit": limit,
        "total": rows["total"],
    }


@router.post("/{comment_id:int}/replies", summary="Create reply")
async def create_reply(
    request: Request,
    db: DbSession,
    comment_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    payload = await request.json()
    body = str(payload.get("body") or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="body is required")
    if len(body) > 2000:
        raise HTTPException(status_code=400, detail="body is too long")

    user_id = _get_user_id(user)
    try:
        async with db.begin():
            row = await comments_repo.create_reply(
                db,
                parent_comment_id=comment_id,
                player_id=user_id,
                body=body,
            )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error creating reply for comment %s: %s", comment_id, exc)
        raise HTTPException(status_code=500, detail="Failed to create reply") from exc

    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/{comment_id:int}", summary="Get comment by id")
async def get_comment_by_id(
    db: DbSession,
    comment_id: int = Path(..., ge=1),
):
    row = await comments_repo.get_comment_by_id(db, comment_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"ok": True, "data": jsonable_encoder(row)}


@router.delete("/{comment_id:int}", summary="Delete comment")
async def delete_comment(
    db: DbSession,
    comment_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    requester_id = _get_user_id(user)
    role = str(user.get("role", "")).lower()
    is_admin = role in {"superadmin", "admin"}
    try:
        async with db.begin():
            row = await comments_repo.soft_delete_comment(
                db,
                comment_id=comment_id,
                requester_id=requester_id,
                is_admin=is_admin,
            )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error deleting comment %s: %s", comment_id, exc)
        raise HTTPException(status_code=500, detail="Failed to delete comment") from exc
    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/players/{player_id:int}", summary="List player comments")
async def list_player_comments(
    db: DbSession,
    player_id: int = Path(..., ge=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    rows = await comments_repo.list_player_comments(
        db,
        player_id=player_id,
        page=page,
        limit=limit,
    )
    return {
        "ok": True,
        "items": jsonable_encoder(rows["items"]),
        "page": page,
        "limit": limit,
        "total": rows["total"],
    }

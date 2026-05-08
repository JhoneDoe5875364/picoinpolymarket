from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional

import pytz
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import suggestions as suggestions_repo

logger = get_logger()

router = APIRouter(prefix="/suggestions")


def _parse_iso_datetime(value: str, field_name: str) -> datetime:
    raw = value.strip()
    if not raw:
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    normalized = raw.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name}. Use ISO datetime format.",
        ) from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=pytz.UTC)
    return parsed.astimezone(pytz.UTC)


def _get_user_id(user: dict) -> int:
    raw_sub = user.get("sub")
    try:
        user_id = int(raw_sub) if raw_sub is not None else None
    except (TypeError, ValueError):
        user_id = None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid user id in token")
    return user_id


@router.get("/categories", summary="List suggestion categories")
async def list_suggestion_categories(db: DbSession):
    rows = await suggestions_repo.list_categories(db)
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/summary", summary="Count suggestions by status")
async def get_suggestions_summary(db: DbSession, user=Depends(verify_token)):
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")
    summary = await suggestions_repo.get_suggestions_summary(db)
    return {"ok": True, "data": jsonable_encoder(summary)}


@router.get("/", summary="List market suggestions", operation_id="list_suggestions")
async def list_suggestions(
    db: DbSession,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query("pending", min_length=1),
    user=Depends(verify_token),
):
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    offset = (page - 1) * limit
    rows, total = await suggestions_repo.list_suggestions(
        db,
        status=status,
        offset=offset,
        limit=limit,
    )
    return {
        "ok": True,
        "items": jsonable_encoder(rows),
        "page": page,
        "limit": limit,
        "total": total,
    }


@router.post("/", summary="Create a market suggestion")
async def create_suggestion(request: Request, db: DbSession, user=Depends(verify_token)):
    data = await request.json()
    user_id = _get_user_id(user)
    question = str(data.get("question") or "").strip()
    description = str(data.get("description") or "").strip()
    category = str(data.get("category") or "").strip()
    start_date = _parse_iso_datetime(str(data.get("start_date") or ""), "start_date")
    end_date = _parse_iso_datetime(str(data.get("end_date") or ""), "end_date")

    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    if not category:
        raise HTTPException(status_code=400, detail="category is required")
    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    try:
        async with db.begin():
            suggestion_row = await suggestions_repo.insert_suggestion(
                db,
                user_id=user_id,
                question=question,
                category=category,
                description=description or None,
                start_date=start_date,
                end_date=end_date,
            )
    except Exception as e:
        logger.error("Error creating suggestion: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create suggestion")

    return {"ok": True, "suggestion": jsonable_encoder(suggestion_row)}


@router.get("/{suggestion_id}", summary="Get one market suggestion", operation_id="get_suggestion")
async def get_suggestion(
    db: DbSession,
    suggestion_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    row = await suggestions_repo.get_suggestion(db, suggestion_id)
    if not row:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return {"ok": True, "data": jsonable_encoder(dict(row))}


@router.post("/{suggestion_id}/reject")
async def reject_suggestion(
    db: DbSession,
    request: Request,
    suggestion_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    reviewer_id = _get_user_id(user)
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    payload = await request.json()
    reason = str(payload.get("reason") or "").strip() or None

    try:
        async with db.begin():
            row = await suggestions_repo.reject_suggestion(
                db,
                suggestion_id=suggestion_id,
                reviewer_id=reviewer_id,
                reason=reason,
            )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as e:
        logger.error("Error rejecting suggestion: %s", e)
        raise HTTPException(status_code=500, detail="Failed to reject suggestion")

    return {"ok": True, "suggestion": jsonable_encoder(row)}


@router.post("/{suggestion_id}/approve")
async def approve_suggestion(
    db: DbSession,
    request: Request,
    suggestion_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    reviewer_id = _get_user_id(user)
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    payload = await request.json()
    question = str(payload.get("question") or "").strip()
    description = str(payload.get("description") or "").strip()
    slug = str(payload.get("slug") or "").strip()
    rules = str(payload.get("rules") or "").strip()
    category = str(payload.get("category") or "").strip()
    image = str(payload.get("image") or "").strip()
    start_date = _parse_iso_datetime(str(payload.get("start_date") or ""), "start_date")
    end_date = _parse_iso_datetime(str(payload.get("end_date") or ""), "end_date")

    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    if not category:
        raise HTTPException(status_code=400, detail="category is required")
    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    liquidity_raw = payload.get("liquidity")
    liquidity: Optional[Decimal] = None
    if liquidity_raw not in (None, ""):
        try:
            liquidity = Decimal(str(liquidity_raw))
        except InvalidOperation as exc:
            raise HTTPException(status_code=400, detail="Invalid liquidity value") from exc
        if liquidity < 0:
            raise HTTPException(status_code=400, detail="liquidity must be >= 0")

    try:
        async with db.begin():
            result = await suggestions_repo.approve_suggestion_create_market(
                db,
                suggestion_id=suggestion_id,
                reviewer_id=reviewer_id,
                question=question,
                description=description or None,
                slug=slug or None,
                rules=rules or None,
                category=category,
                liquidity=liquidity,
                start_date=start_date,
                end_date=end_date,
                image=image or None,
            )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as e:
        logger.error("Error approving suggestion: %s", e)
        raise HTTPException(status_code=500, detail="Failed to approve suggestion")

    return {"ok": True, **jsonable_encoder(result)}

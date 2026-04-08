import uuid
from datetime import datetime, timedelta
from math import ceil
from typing import Optional

import pytz
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import admin as admin_repo

logger = get_logger()

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/markets")
async def create_market(request: Request, db: DbSession, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    _ = user_id
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="HasNotSuperadminRole")

    data = await request.json()
    question = data.get("question")
    description = data.get("description")
    category_slug = data.get("category")
    category_id_raw = data.get("category_id")
    resolution_date_str = data.get("resolution_date_str")
    resolution_time_str = data.get("resolution_time_str")
    timezone_str = data.get("timezone")
    checklist_resolution_clarity = data.get("checklist_resolution_clarity")
    checklist_restricted_topics = data.get("checklist_restricted_topics")

    resolution_dt = None
    if resolution_date_str:
        try:
            date_part = datetime.strptime(resolution_date_str, "%Y-%m-%d").date()
            if resolution_time_str:
                try:
                    time_part = datetime.strptime(resolution_time_str, "%H:%M:%S").time()
                except ValueError:
                    try:
                        time_part = datetime.strptime(resolution_time_str + ":00", "%H:%M:%S").time()
                    except ValueError:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid time format: {resolution_time_str}. Expected HH:MM or HH:MM:SS",
                        )
            else:
                time_part = datetime.min.time()
            naive_dt = datetime.combine(date_part, time_part)
            if timezone_str:
                try:
                    tz = pytz.timezone(timezone_str)
                    resolution_dt = tz.localize(naive_dt).astimezone(pytz.UTC)
                except pytz.exceptions.UnknownTimeZoneError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unknown timezone: {timezone_str}. Use IANA timezone names.",
                    )
            else:
                resolution_dt = pytz.UTC.localize(naive_dt)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date/time format. Date: YYYY-MM-DD, Time: HH:MM:SS. Error: {str(e)}",
            )

    if not resolution_dt:
        raise HTTPException(
            status_code=400,
            detail="Either 'resolution_date' (ISO 8601) or 'resolution_date_str' with optional 'resolution_time_str' and 'timezone' must be provided",
        )

    end_date = resolution_dt - timedelta(days=1)
    resolution_date_utc = (
        resolution_dt.replace(tzinfo=None) if resolution_dt.tzinfo else resolution_dt
    )
    end_date_naive = end_date.replace(tzinfo=None) if end_date.tzinfo else end_date

    explicit_cat: Optional[uuid.UUID] = None
    if category_id_raw is not None:
        try:
            explicit_cat = uuid.UUID(str(category_id_raw))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category_id (expected UUID)")

    try:
        async with db.begin():
            resolved_cat = await admin_repo.resolve_category_id(
                db,
                slug=category_slug if isinstance(category_slug, str) else None,
                explicit_id=explicit_cat,
            )
            market_row = await admin_repo.insert_market_admin(
                db,
                question=question,
                category_id=resolved_cat,
                description=description,
                end_date_naive=end_date_naive,
                resolution_date_utc_naive=resolution_date_utc,
                checklist_resolution_clarity=bool(checklist_resolution_clarity),
                checklist_restricted_topics=bool(checklist_restricted_topics),
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating market: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create market")

    return {"ok": True, "market": jsonable_encoder(market_row)}


@router.get("/markets")
async def get_markets(
    db: DbSession,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    search: str = Query(""),
    status: Optional[str] = Query(None),
    user=Depends(verify_token),
):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    allowed_sort_columns = {"created_at", "question", "status", "end_date"}
    if sort_by not in allowed_sort_columns:
        sort_by = "created_at"
    order = order.lower() if order.lower() in ("asc", "desc") else "desc"

    total, rows = await admin_repo.admin_markets_page(
        db,
        page=page,
        limit=limit,
        sort_by=sort_by,
        order=order,
        search=search,
        status=status,
    )
    return {
        "ok": True,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": ceil(total / limit) if total else 0,
        "data": jsonable_encoder(rows),
    }


@router.get("/resolutions")
async def get_resolutions(
    db: DbSession,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    sort_by: str = Query("resolved_at"),
    order: str = Query("desc"),
    search: str = Query(""),
    user=Depends(verify_token),
):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    allowed_sort_columns = {
        "resolved_at",
        "resolved_outcome",
        "title",
        "created_at",
        "total_volume",
        "resolved_by_username",
    }
    if sort_by not in allowed_sort_columns:
        sort_by = "resolved_at"
    order = order.lower() if order.lower() in ("asc", "desc") else "desc"

    total, rows = await admin_repo.admin_resolutions_page(
        db,
        page=page,
        limit=limit,
        sort_by=sort_by,
        order=order,
        search=search,
    )
    return {
        "ok": True,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": ceil(total / limit) if total else 0,
        "data": jsonable_encoder(rows),
    }


@router.post("/markets/{market_id}/resolve/{outcome}")
async def resolve_market(
    db: DbSession,
    market_id: int = Path(...),
    outcome: str = Path(...),
    user=Depends(verify_token),
):
    user_id = user.get("sub", "")
    username = user.get("username", "")
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="HasNotSuperadminRole")
    if outcome not in {"yes", "no"}:
        raise HTTPException(status_code=400, detail="Invalid outcome value")

    try:
        async with db.begin():
            updated_row = await admin_repo.resolve_market_row(
                db,
                market_id=market_id,
                outcome=outcome,
                user_id=user_id,
                username=username,
            )
    except LookupError:
        raise HTTPException(status_code=404, detail="Market not found")
    except Exception as e:
        logger.error("Error resolving market %s: %s", market_id, e)
        raise HTTPException(status_code=500, detail="Failed to resolve market")

    return {"ok": True, "data": jsonable_encoder(updated_row)}


@router.post("/markets/{market_id}/cancel")
async def cancel_market(
    db: DbSession,
    market_id: int = Path(...),
    user=Depends(verify_token),
):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="HasNotSuperadminRole")

    try:
        async with db.begin():
            await admin_repo.cancel_market_flow(db, market_id)
    except LookupError:
        raise HTTPException(status_code=404, detail="MarketNotFound")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error cancelling market %s: %s", market_id, e)
        raise HTTPException(status_code=500, detail="Failed to cancel market")

    return {"ok": True}


@router.get("/platform_state")
async def get_platform_state(db: DbSession, user=Depends(verify_token)):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    stats = await admin_repo.platform_state_counts(db)
    return {"ok": True, **stats}

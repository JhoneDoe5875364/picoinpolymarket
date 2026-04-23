import base64
import binascii
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from math import ceil
from pathlib import Path as FsPath
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
PROJECT_ROOT = FsPath(__file__).resolve().parents[4]
MARKET_IMAGE_DIR = PROJECT_ROOT / "frontend" / "public" / "images" / "markets"
if not MARKET_IMAGE_DIR.exists():
    MARKET_IMAGE_DIR = PROJECT_ROOT / "frontend" / "images" / "markets"
MARKET_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
BASE64_DATA_PREFIX = re.compile(r"^data:image/[a-zA-Z0-9.+-]+;base64,")


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
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(pytz.UTC).replace(tzinfo=None)
    return parsed


def _safe_image_name(filename: str) -> str:
    stem = FsPath(filename).name
    ext = FsPath(stem).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: .png, .jpg, .jpeg, .webp, .gif",
        )
    token = re.sub(r"[^a-zA-Z0-9._-]", "-", FsPath(stem).stem).strip("-")
    if not token:
        token = "market-image"
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"{token}-{timestamp}{ext}"


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
    rules = data.get("rules")
    category_slug = data.get("category")
    category_id_raw = data.get("category_id")
    start_date_raw = data.get("start_date")
    end_date_raw = data.get("end_date")
    liquidity_raw = data.get("liquidity")
    icon_raw = data.get("icon")
    checklist_resolution_clarity = data.get("checklist_resolution_clarity")
    checklist_restricted_topics = data.get("checklist_restricted_topics")

    question = str(question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    if not category_slug and category_id_raw is None:
        raise HTTPException(status_code=400, detail="category is required")

    start_date = _parse_iso_datetime(str(start_date_raw or ""), "start_date")
    end_date = _parse_iso_datetime(str(end_date_raw or ""), "end_date")
    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    liquidity: Optional[Decimal] = None
    if liquidity_raw not in (None, ""):
        try:
            liquidity = Decimal(str(liquidity_raw))
        except InvalidOperation as exc:
            raise HTTPException(status_code=400, detail="Invalid liquidity value") from exc
        if liquidity < 0:
            raise HTTPException(status_code=400, detail="liquidity must be >= 0")

    icon = str(icon_raw).strip() if icon_raw else None

    explicit_cat: Optional[int] = None
    if category_id_raw is not None:
        try:
            explicit_cat = int(category_id_raw)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid category_id (expected integer)")

    try:
        async with db.begin():
            resolved_cat = await admin_repo.resolve_category_id(
                db,
                slug=category_slug if isinstance(category_slug, str) else None,
                explicit_id=explicit_cat,
            )
            if resolved_cat is None:
                raise HTTPException(status_code=400, detail="Unknown category")
            market_row = await admin_repo.insert_market_admin(
                db,
                question=question,
                category_id=resolved_cat,
                description=description,
                rules=rules,
                start_date_naive=start_date,
                end_date_naive=end_date,
                liquidity=liquidity,
                icon=icon,
                checklist_resolution_clarity=bool(checklist_resolution_clarity) if checklist_resolution_clarity is not None else True,
                checklist_restricted_topics=bool(checklist_restricted_topics) if checklist_restricted_topics is not None else True,
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating market: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create market")

    return {"ok": True, "market": jsonable_encoder(market_row)}


@router.get("/markets/categories")
async def get_market_categories(db: DbSession, user=Depends(verify_token)):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    rows = await admin_repo.list_categories(db)
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/markets/images")
async def get_market_images(user=Depends(verify_token)):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    images = []
    for path in sorted(MARKET_IMAGE_DIR.glob("*")):
        if path.is_file() and path.suffix.lower() in ALLOWED_IMAGE_EXTENSIONS:
            images.append(
                {
                    "name": path.name,
                    "url": f"/images/markets/{path.name}",
                }
            )
    return {"ok": True, "data": images}


@router.post("/markets/images")
async def upload_market_image(request: Request, user=Depends(verify_token)):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="HasNotSuperadminRole")

    data = await request.json()
    original_name = str(data.get("filename") or "").strip()
    content_base64 = str(data.get("content_base64") or "").strip()

    if not original_name:
        raise HTTPException(status_code=400, detail="filename is required")
    if not content_base64:
        raise HTTPException(status_code=400, detail="content_base64 is required")

    normalized_payload = BASE64_DATA_PREFIX.sub("", content_base64)
    try:
        decoded = base64.b64decode(normalized_payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image payload") from exc

    saved_name = _safe_image_name(original_name)
    save_path = MARKET_IMAGE_DIR / saved_name
    save_path.write_bytes(decoded)

    return {"ok": True, "data": {"name": saved_name, "url": f"/images/markets/{saved_name}"}}


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

import base64
import binascii
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from math import ceil
from pathlib import Path as FsPath
from typing import Literal, Optional

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


def _parse_optional_iso_datetime(value: str, field_name: str) -> Optional[datetime]:
    raw = value.strip()
    if not raw:
        return None
    return _parse_iso_datetime(raw, field_name)


def _normalize_optional_text(value: object) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


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
    slug = data.get("slug")
    description = data.get("description")
    rules = data.get("rules")
    yes_criteria = _normalize_optional_text(data.get("yes_criteria"))
    no_criteria = _normalize_optional_text(data.get("no_criteria"))
    edge_cases = _normalize_optional_text(data.get("edge_cases"))
    market_context = _normalize_optional_text(data.get("market_context"))
    resolution_source = _normalize_optional_text(data.get("resolution_source"))
    resolution_time_raw = data.get("resolution_time")
    category_slug = data.get("category")
    category_id_raw = data.get("category_id")
    start_date_raw = data.get("start_date")
    end_date_raw = data.get("end_date")
    liquidity_raw = data.get("liquidity")
    icon_raw = data.get("icon")

    question = str(question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    if not category_slug and category_id_raw is None:
        raise HTTPException(status_code=400, detail="category is required")

    start_date = _parse_iso_datetime(str(start_date_raw or ""), "start_date")
    end_date = _parse_iso_datetime(str(end_date_raw or ""), "end_date")
    resolution_time = _parse_optional_iso_datetime(str(resolution_time_raw or ""), "resolution_time")
    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    if resolution_time is not None and resolution_time < start_date:
        raise HTTPException(status_code=400, detail="resolution_time must be after start_date")

    required_rules_fields = {
        "yes_criteria": yes_criteria,
        "no_criteria": no_criteria,
        "resolution_source": resolution_source,
        "edge_cases": edge_cases,
    }
    populated_required_fields = [key for key, value in required_rules_fields.items() if value]
    if populated_required_fields and len(populated_required_fields) != len(required_rules_fields):
        missing = [key for key, value in required_rules_fields.items() if not value]
        raise HTTPException(
            status_code=400,
            detail=f"Missing required structured rule fields: {', '.join(missing)}",
        )

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
            resolved_cat = await admin_repo.get_category_by_slug(
                db,
                slug=category_slug if isinstance(category_slug, str) else None,
                explicit_id=explicit_cat,
            )
            if resolved_cat is None:
                raise HTTPException(status_code=400, detail="Unknown category")
            market_row = await admin_repo.insert_market(
                db,
                question=question,
                slug=slug,
                category_id=resolved_cat,
                description=description,
                rules=rules,
                yes_criteria=yes_criteria,
                no_criteria=no_criteria,
                edge_cases=edge_cases,
                market_context=market_context,
                resolution_source=resolution_source,
                resolution_time=resolution_time,
                start_date_naive=start_date,
                end_date_naive=end_date,
                liquidity=liquidity,
                icon=icon,
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating market: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create market")

    return {"ok": True, "market": jsonable_encoder(market_row)}


@router.put("/markets/{market_id}")
async def update_market(
    request: Request,
    db: DbSession,
    market_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="HasNotSuperadminRole")

    data = await request.json()
    question = str(data.get("question") or "").strip()
    slug = str(data.get("slug") or "").strip()
    description = data.get("description")
    rules = data.get("rules")
    yes_criteria = _normalize_optional_text(data.get("yes_criteria"))
    no_criteria = _normalize_optional_text(data.get("no_criteria"))
    edge_cases = _normalize_optional_text(data.get("edge_cases"))
    market_context = _normalize_optional_text(data.get("market_context"))
    resolution_source = _normalize_optional_text(data.get("resolution_source"))
    resolution_time_raw = data.get("resolution_time")
    category_slug = data.get("category")
    category_id_raw = data.get("category_id")
    start_date_raw = data.get("start_date")
    end_date_raw = data.get("end_date")
    liquidity_raw = data.get("liquidity")
    icon_raw = data.get("icon")

    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    if not slug:
        raise HTTPException(status_code=400, detail="slug is required")
    if not category_slug and category_id_raw is None:
        raise HTTPException(status_code=400, detail="category is required")

    start_date = _parse_iso_datetime(str(start_date_raw or ""), "start_date")
    end_date = _parse_iso_datetime(str(end_date_raw or ""), "end_date")
    resolution_time = _parse_optional_iso_datetime(str(resolution_time_raw or ""), "resolution_time")
    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    if resolution_time is not None and resolution_time < start_date:
        raise HTTPException(status_code=400, detail="resolution_time must be after start_date")

    required_rules_fields = {
        "yes_criteria": yes_criteria,
        "no_criteria": no_criteria,
        "resolution_source": resolution_source,
        "edge_cases": edge_cases,
    }
    populated_required_fields = [key for key, value in required_rules_fields.items() if value]
    if populated_required_fields and len(populated_required_fields) != len(required_rules_fields):
        missing = [key for key, value in required_rules_fields.items() if not value]
        raise HTTPException(
            status_code=400,
            detail=f"Missing required structured rule fields: {', '.join(missing)}",
        )

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
            resolved_cat = await admin_repo.get_category_by_slug(
                db,
                slug=category_slug if isinstance(category_slug, str) else None,
                explicit_id=explicit_cat,
            )
            if resolved_cat is None:
                raise HTTPException(status_code=400, detail="Unknown category")
            market_row = await admin_repo.update_market(
                db,
                market_id=market_id,
                question=question,
                slug=slug,
                category_id=resolved_cat,
                description=description,
                rules=rules,
                yes_criteria=yes_criteria,
                no_criteria=no_criteria,
                edge_cases=edge_cases,
                market_context=market_context,
                resolution_source=resolution_source,
                resolution_time=resolution_time,
                start_date_naive=start_date,
                end_date_naive=end_date,
                liquidity=liquidity,
                icon=icon,
            )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating market %s: %s", market_id, e)
        raise HTTPException(status_code=500, detail="Failed to update market")

    return {"ok": True, "market": jsonable_encoder(market_row)}


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


@router.post("/markets/close", summary="Close a market")
async def close_market(
    db: DbSession,
    market_id: int = Query(..., ge=1),
    user=Depends(verify_token),
):
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    try:
        async with db.begin():
            row = await admin_repo.close_market(db, market_id=market_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error closing market %s: %s", market_id, exc)
        raise HTTPException(status_code=500, detail="Failed to close market") from exc

    return {"ok": True, "data": jsonable_encoder(row)}


@router.post("/markets/resolve", summary="Resolve a market")
async def resolve_market(
    db: DbSession,
    market_id: int = Query(..., ge=1),
    outcome: Literal["YES", "NO"] = Query(...),
    user=Depends(verify_token),
):
    user_id = str(user.get("sub", ""))
    username = str(user.get("username", ""))
    role = user.get("role", "")
    if role not in ("superadmin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    normalized_outcome = outcome.upper()

    try:
        async with db.begin():
            row = await admin_repo.resolve_market(
                db,
                market_id=market_id,
                outcome=normalized_outcome,
                user_id=user_id,
                username=username,
            )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error resolving market %s with %s: %s", market_id, normalized_outcome, exc)
        raise HTTPException(status_code=500, detail="Failed to resolve market") from exc

    return {"ok": True, "data": jsonable_encoder(row)}


@router.post("/resolve", summary="Resolve a market")
async def resolve_market_direct(
    db: DbSession,
    market_id: int = Query(..., ge=1),
    outcome: Literal["YES", "NO"] = Query(...),
    user=Depends(verify_token),
):
    user_id = str(user.get("sub", ""))
    username = str(user.get("username", ""))
    role = user.get("role", "")
    if role not in ("superadmin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    normalized_outcome = outcome.upper()

    try:
        async with db.begin():
            row = await admin_repo.resolve_market(
                db,
                market_id=market_id,
                outcome=normalized_outcome,
                user_id=user_id,
                username=username,
            )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error resolving market %s with %s: %s", market_id, normalized_outcome, exc)
        raise HTTPException(status_code=500, detail="Failed to resolve market") from exc

    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/metrics")
async def get_metrics(db: DbSession, user=Depends(verify_token)):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    stats = await admin_repo.metrics(db)
    return {"ok": True, "data": jsonable_encoder(stats)}

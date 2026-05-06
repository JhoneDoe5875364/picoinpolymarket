import re
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional, Union
from pathlib import Path as FsPath

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from app.core.config import Config
from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import markets as markets_repo

logger = get_logger()

router = APIRouter(prefix="/markets", tags=["markets"])

FEE_RATE = Config.FEE_RATE
PROJECT_ROOT = FsPath(__file__).resolve().parents[4]
MARKET_IMAGE_DIR = PROJECT_ROOT / "frontend" / "public" / "images" / "markets"
if not MARKET_IMAGE_DIR.exists():
    MARKET_IMAGE_DIR = PROJECT_ROOT / "frontend" / "images" / "markets"
MARKET_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
BASE64_DATA_PREFIX = re.compile(r"^data:image/[a-zA-Z0-9.+-]+;base64,")


@router.get("/", summary="List markets")
async def list_markets(
    db: DbSession,
    limit: int = Query(default=10, ge=1),
    offset: int = Query(default=0, ge=0),
    order: str = Query(default="created_at"),
    ascending: bool = Query(default=False),
    discovery: Literal["default", "trending", "new", "hot", "ending_soon", "most_discussed"] = Query(default="default"),
    search: Optional[str] = Query(default=None),
    category: str = Query(default="all", min_length=1),
    status: Optional[str] = Query(default=None),
    closed: Optional[bool] = Query(default=None),
    resolved: Optional[bool] = Query(default=None),
    volume_min: Optional[Union[Decimal, float]] = Query(default=None),
    volume_max: Optional[Union[Decimal, float]] = Query(default=None),
    start_date_min: Optional[datetime] = Query(default=None),
    start_date_max: Optional[datetime] = Query(default=None),
    end_date_min: Optional[datetime] = Query(default=None),
    end_date_max: Optional[datetime] = Query(default=None),
):
    rows = await markets_repo.list_markets(
        db,
        limit=limit,
        offset=offset,
        order=order,
        ascending=ascending,
        discovery=discovery,
        search=search,
        category=category,
        status=status,
        closed=closed,
        resolved=resolved,
        volume_min=volume_min,
        volume_max=volume_max,
        start_date_min=start_date_min,
        start_date_max=start_date_max,
        end_date_min=end_date_min,
        end_date_max=end_date_max,
    )
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/summary", summary="Get market status summary")
async def get_market_status_summary(
    db: DbSession,
    search: Optional[str] = Query(default=None),
    category: str = Query(default="all", min_length=1),
    active_only: bool = Query(default=True),
):
    summary = await markets_repo.market_status_summary(
        db,
        search=search,
        category=category,
        active_only=active_only,
    )
    return {"ok": True, "data": jsonable_encoder(summary)}


@router.get("/{market_id:int}", summary="Get market by id")
async def get_market_by_id(market_id: int, db: DbSession):
    row = await markets_repo.get_market_by_id(db, market_id)
    if not row:
        raise HTTPException(status_code=404, detail="Market not found")
    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/slug/{slug}", summary="Get market by slug")
async def get_market_by_slug(slug: str, db: DbSession):
    row = await markets_repo.get_market_by_slug(db, slug)
    if not row:
        raise HTTPException(status_code=404, detail="Market not found")
    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/holders", summary="Get top holders for market")
async def get_market_holders(
    db: DbSession,
    market_id: int = Query(..., ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    min_balance: int = Query(default=1, ge=0, le=999999),
):
    try:
        rows = await markets_repo.market_holders(
            db,
            market_id=market_id,
            limit=limit,
            offset=offset,
            min_balance=min_balance,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/prices-history")
async def get_market_prices_history(
    db: DbSession,
    market_id: int = Query(..., ge=1),
    start_ts: Optional[datetime] = Query(default=None),
    end_ts: Optional[datetime] = Query(default=None),
    interval: Optional[str] = Query(default='1H'),
):
    allowed_intervals = {"1H", "1D", "1W", "1M", "1Y", "MAX"}
    if interval not in allowed_intervals:
        raise HTTPException(
            status_code=400,
            detail="Invalid interval. Allowed values are: 1H, 1D, 1W, 1M, 1Y, MAX",
        )

    rows = await markets_repo.market_prices_history(
        db,
        market_id,
        start_ts=start_ts,
        end_ts=end_ts,
        interval=interval,
    )
    return {"ok": True, "data": jsonable_encoder(rows or [])}


@router.get("/trades", summary="Retrieves trades for a market")
async def get_market_trades(
    db: DbSession,
    market_id: int = Query(..., ge=1),
    min_amount: Optional[Union[Decimal, float]] = Query(default=None, ge=0),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    order: str = Query(default="created_at"),
    ascending: bool = Query(default=False),
):
    rows = await markets_repo.list_market_trades(
        db,
        market_id=market_id,
        min_amount=min_amount,
        offset=offset,
        limit=limit,
        order=order,
        ascending=ascending,
    )
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/price", summary="Get market price by token id")
async def get_market_price(
    db: DbSession,
    token: str = Query(..., min_length=1),
    side: Literal["BUY", "SELL"] = Query(...),
):
    row = await markets_repo.get_market_price(db, token=token, side=side)
    if not row:
        raise HTTPException(status_code=404, detail="Market not found for token")
    return {"ok": True, "data": jsonable_encoder(row)}


@router.get("/prices", summary="Get market prices by token ids")
async def get_market_prices(
    db: DbSession,
    tokens: str = Query(..., min_length=1),
    sides: str = Query(..., min_length=1),
):
    token_list = [token.strip() for token in tokens.split(",") if token.strip()]
    side_list = [side.strip().upper() for side in sides.split(",") if side.strip()]

    if not token_list:
        raise HTTPException(status_code=400, detail="tokens is required")
    if not side_list:
        raise HTTPException(status_code=400, detail="sides is required")
    if len(token_list) != len(side_list):
        raise HTTPException(
            status_code=400,
            detail="tokens and sides must have the same number of items",
        )
    if any(side not in {"BUY", "SELL"} for side in side_list):
        raise HTTPException(
            status_code=400,
            detail="sides must be a comma-separated list of BUY or SELL",
        )

    rows = await markets_repo.get_market_prices(
        db, tokens=token_list, sides=side_list
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Market not found for tokens")
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/positions", summary="Get positions by market")
async def get_positions(
    db: DbSession,
    market_id: int = Query(..., ge=1),
    status: Optional[str] = Query(default='ALL'),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    order: str = Query(default="shares"),
    ascending: bool = Query(default=False),
):
    try:
        rows = await markets_repo.list_positions(
            db,
            market_id=market_id,
            status=status,
            limit=limit,
            offset=offset,
            order=order,
            ascending=ascending,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.post("/close", summary="Close a market")
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
            row = await markets_repo.close_market(db, market_id=market_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error closing market %s: %s", market_id, exc)
        raise HTTPException(status_code=500, detail="Failed to close market") from exc

    return {"ok": True, "data": jsonable_encoder(row)}


@router.post("/resolve", summary="Resolve a market")
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
            row = await markets_repo.resolve_market(
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


@router.get("/categories")
async def get_market_categories(db: DbSession, user=Depends(verify_token)):
    _ = user.get("sub", "")
    role = user.get("role", "")
    if role not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="HasNotAdminRole")

    rows = await markets_repo.list_categories(db)
    return {"ok": True, "data": jsonable_encoder(rows)}


@router.get("/images")
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

"""
GeoControl API Routes
Provides geo information and checks
"""
from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.core.tier_engine import get_tier_engine
from app.core.category_engine import get_category_engine
from app.core.ip_resolver import get_ip_resolver
from app.core.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/geo", tags=["geo"])


class GeoMeResponse(BaseModel):
    """Response model for /api/geo/me"""
    ip: str
    region_code: Optional[str] = None
    state_code: Optional[str] = None
    city_code: Optional[str] = None
    tier_name: str
    allowed_categories: List[str]
    restricted_categories: List[str]
    blocked_categories: List[str]
    is_blocked: bool


class CategoryCheckRequest(BaseModel):
    """Request model for category access check"""
    category_key: str


class CategoryCheckResponse(BaseModel):
    """Response model for category check"""
    category_key: str
    allowed: bool
    reason: str


class GeoCheckRequest(BaseModel):
    """Request model for geo check"""
    ip: Optional[str] = None
    category_key: Optional[str] = None


class GeoCheckResponse(BaseModel):
    """Response model for geo check"""
    ip: str
    region_code: str
    state_code: Optional[str]
    tier_name: str
    is_accessible: bool
    categories: dict


@router.get("/debug/headers")
async def debug_headers(request: Request):
    headers = {k: v for k, v in request.headers.items()}
    client_ip = request.client.host if request.client else None
    
    return {
        "client_ip": client_ip,
        "headers": headers
    }


@router.get("/me", response_model=GeoMeResponse)
async def get_geo_me(request: Request) -> GeoMeResponse:
    """
    Get current user's geo information
    Called by frontend on app load
    """
    # Safely access request.state attributes with defaults
    client_ip = getattr(request.state, 'client_ip', 'UNKNOWN')
    tier_name = getattr(request.state, 'tier_name', 'UNKNOWN')
    allowed_categories = getattr(request.state, 'allowed_categories', [])
    restricted_categories = getattr(request.state, 'restricted_categories', [])
    blocked_categories = getattr(request.state, 'blocked_categories', [])
    
    return GeoMeResponse(
        ip=client_ip,
        region_code=request.headers.get("cf-ipcountry"),
        state_code=request.headers.get("cf-region"),
        city_code=request.headers.get("cf-city"),
        tier_name=tier_name,
        allowed_categories=allowed_categories,
        restricted_categories=restricted_categories,
        blocked_categories=blocked_categories,
        is_blocked=tier_name == 'tier1'
    )


@router.post("/check-category", response_model=CategoryCheckResponse)
async def check_category_access(
    request: Request,
    body: CategoryCheckRequest
) -> CategoryCheckResponse:
    """
    Check if a specific category is accessible for the user
    """
    category_engine = get_category_engine()
    
    result = category_engine.check_category_access(
        region_code=getattr(request.state, 'region_code', 'UNKNOWN'),
        category_key=body.category_key,
        state_code=getattr(request.state, 'state_code', None)
    )
    
    return CategoryCheckResponse(
        category_key=body.category_key,
        allowed=result.allowed,
        reason=result.reason
    )


@router.post("/check", response_model=GeoCheckResponse)
async def check_geo(
    request: Request,
    body: GeoCheckRequest
) -> GeoCheckResponse:
    """
    Check geo information and category accessibility
    Can check other IPs if provided
    """
    ip_resolver = get_ip_resolver()
    tier_engine = get_tier_engine()
    category_engine = get_category_engine()
    
    # Use provided IP or request IP
    client_ip = getattr(request.state, 'client_ip', 'UNKNOWN')
    check_ip = body.ip or client_ip
    
    # Resolve IP
    region_code, state_code = ip_resolver.resolve_ip_to_region(check_ip)
    
    # Get tier info
    tier_name = tier_engine.get_tier_for_region(region_code)
    
    # Build categories info
    categories_info = {}
    if body.category_key:
        result = category_engine.check_category_access(
            region_code=region_code,
            category_key=body.category_key,
            state_code=state_code
        )
        categories_info[body.category_key] = {
            "allowed": result.allowed,
            "reason": result.reason
        }
    else:
        # Check all categories
        all_categories = tier_engine.config.get_categories()
        for cat_key in all_categories:
            result = category_engine.check_category_access(
                region_code=region_code,
                category_key=cat_key,
                state_code=state_code
            )
            categories_info[cat_key] = {
                "allowed": result.allowed,
                "reason": result.reason
            }
    
    return GeoCheckResponse(
        ip=check_ip,
        region_code=region_code,
        state_code=state_code,
        tier_name=tier_name,
        is_accessible=tier_name != 'tier1',
        categories=categories_info
    )


@router.get("/health")
async def geo_health():
    """Health check endpoint for geo service"""
    return {"status": "ok", "service": "geocontrol"}

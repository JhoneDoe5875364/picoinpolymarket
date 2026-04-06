"""
GeoControl Decorators
"""
from functools import wraps
from typing import Callable, List, Optional

from fastapi import HTTPException, Request

from app.core.category_engine import get_category_engine
from app.core.compliance_logger import log_access_blocked, log_category_restriction
from app.core.logger import get_logger

logger = get_logger()


def geoblock(
    category_key: Optional[str] = None,
    allowed_tiers: Optional[List[str]] = None,
    require_attestation: bool = False,
):
    if allowed_tiers is None:
        allowed_tiers = ["tier2", "tier3"]

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            tier = getattr(request.state, "tier_name", "tier1")
            region_code = getattr(request.state, "region_code", "unknown")
            state_code = getattr(request.state, "state_code", None)
            client_ip = getattr(request.state, "client_ip", "0.0.0.0")
            user_id = getattr(request.state, "user_id", None)

            if tier not in allowed_tiers:
                await log_access_blocked(
                    request,
                    ip=client_ip,
                    region_code=region_code,
                    reason=f"Tier {tier} not allowed to access this endpoint",
                    user_id=user_id,
                    state_code=state_code,
                )
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied for tier {tier}",
                )

            if category_key:
                category_engine = get_category_engine()
                result = category_engine.check_category_access(
                    region_code=region_code,
                    category_key=category_key,
                    state_code=state_code,
                )
                if not result.allowed:
                    await log_category_restriction(
                        request,
                        user_id=user_id,
                        ip=client_ip,
                        region_code=region_code,
                        category_key=category_key,
                        reason=result.reason,
                        state_code=state_code,
                    )
                    raise HTTPException(
                        status_code=403,
                        detail=f"Category access denied: {result.reason}",
                    )

            if require_attestation:
                pass

            return await func(request, *args, **kwargs)

        return wrapper

    return decorator


def geoblock_sync(
    category_key: Optional[str] = None,
    allowed_tiers: Optional[List[str]] = None,
):
    if allowed_tiers is None:
        allowed_tiers = ["allowed", "restricted"]

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request: Request, *args, **kwargs):
            tier = getattr(request.state, "tier", "full_block")
            region_code = getattr(request.state, "region_code", "unknown")
            if tier not in allowed_tiers:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied for tier {tier}",
                )
            if category_key:
                category_engine = get_category_engine()
                result = category_engine.check_category_access(
                    region_code=region_code,
                    category_key=category_key,
                )
                if not result.allowed:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Category access denied: {result.reason}",
                    )
            return func(request, *args, **kwargs)

        return wrapper

    return decorator

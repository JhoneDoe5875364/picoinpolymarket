"""
GeoControl Decorators
Decorators for enforcing geo restrictions on endpoints
"""
from typing import Callable, Optional, List
from functools import wraps
from fastapi import Request, HTTPException
from app.core.category_engine import get_category_engine
from app.core.compliance_logger import get_compliance_logger
from app.core.logger import get_logger

logger = get_logger()


def geoblock(
    category_key: Optional[str] = None,
    allowed_tiers: Optional[List[str]] = None,
    require_attestation: bool = False
):
    """
    Decorator to enforce geoblock restrictions on FastAPI endpoints
    
    Args:
        category_key: Category to check access for (optional)
        allowed_tiers: List of allowed tiers (default: ['allowed', 'restricted'])
        require_attestation: Require attestation before access
    """
    if allowed_tiers is None:
        allowed_tiers = ['tier2', 'tier3']
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            tier = getattr(request.state, 'tier_name', 'tier1')
            region_code = getattr(request.state, 'region_code', 'unknown')
            state_code = getattr(request.state, 'state_code', None)
            client_ip = getattr(request.state, 'client_ip', '0.0.0.0')
            user_id = getattr(request.state, 'user_id', None)
            
            logger.info(f"🌍 Geo decorator: IP={client_ip}, Region={region_code}, State={state_code}, Tier={tier}, UserId={user_id}")
            
            compliance_logger = get_compliance_logger()
            
            # Check tier
            if tier not in allowed_tiers:
                compliance_logger.log_access_blocked(
                    ip=client_ip,
                    region_code=region_code,
                    reason=f"Tier {tier} not allowed to access this endpoint",
                    user_id=user_id,
                    state_code=state_code
                )
                # logger.warning(f"🚫 Blocked {tier} tier from accessing {request.url.path}")
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied for tier {tier}"
                )
            
            # Check category access if specified
            if category_key:
                category_engine = get_category_engine()
                result = category_engine.check_category_access(
                    region_code=region_code,
                    category_key=category_key,
                    state_code=state_code
                )
                
                if not result.allowed:
                    compliance_logger.log_category_restriction(
                        user_id=user_id,
                        ip=client_ip,
                        region_code=region_code,
                        category_key=category_key,
                        reason=result.reason,
                        state_code=state_code
                    )
                    # logger.warning(f"🚫 Category {category_key} blocked: {result.reason}")
                    raise HTTPException(
                        status_code=403,
                        detail=f"Category access denied: {result.reason}"
                    )
            
            # Check attestation if required
            if require_attestation:
                # This would check if user has attested
                # Implementation depends on auth system
                pass
            
            # Call original endpoint
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def geoblock_sync(
    category_key: Optional[str] = None,
    allowed_tiers: Optional[List[str]] = None
):
    """
    Sync version of geoblock decorator for non-async endpoints
    """
    if allowed_tiers is None:
        allowed_tiers = ['allowed', 'restricted']
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request: Request, *args, **kwargs):
            tier = getattr(request.state, 'tier', 'full_block')
            region_code = getattr(request.state, 'region_code', 'unknown')
            
            if tier not in allowed_tiers:
                # logger.warning(f"🚫 Blocked {tier} tier from accessing {request.url.path}")
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied for tier {tier}"
                )
            
            if category_key:
                category_engine = get_category_engine()
                result = category_engine.check_category_access(
                    region_code=region_code,
                    category_key=category_key
                )
                
                if not result.allowed:
                    # logger.warning(f"🚫 Category {category_key} blocked: {result.reason}")
                    raise HTTPException(
                        status_code=403,
                        detail=f"Category access denied: {result.reason}"
                    )
            
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator

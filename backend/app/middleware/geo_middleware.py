"""
GeoControl Middleware
Enforces geocontrol policies at the backend layer
"""
from typing import Optional, Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.ip_resolver import get_ip_resolver
from app.core.tier_engine import get_tier_engine
from app.core.compliance_logger import get_compliance_logger
from app.core.logger import get_logger
import os
from dotenv import load_dotenv


# Load .env once
load_dotenv()

logger = get_logger()


class GeoResolveMiddleware(BaseHTTPMiddleware):
    """
    Middleware to resolve client region and attach to request state
    """

    def __init__(self, app):
        super().__init__(app)

        # Main components
        self.ip_resolver = get_ip_resolver()
        self.tier_engine = get_tier_engine()
        self.compliance_logger = get_compliance_logger()

        # Load whitelist settings directly from .env
        self.frontend_whitelist_domains = set(
            d.strip().lower() for d in os.getenv("FRONTEND_WHITELIST_DOMAINS", "").split(",") if d.strip()
        )
        self.frontend_whitelist_ips = set(
            ip.strip() for ip in os.getenv("FRONTEND_WHITELIST_IPS", "").split(",") if ip.strip()
        )

        logger.info(
            f"Loaded frontend whitelist domains: {self.frontend_whitelist_domains}")
        logger.info(
            f"Loaded frontend whitelist IPs: {self.frontend_whitelist_ips}")

    def is_frontend_request(self, request: Request, client_ip: str) -> bool:
        """
        Determine whether the request is made directly from frontend
        """
        # 1. Check IP whitelist
        if client_ip in self.frontend_whitelist_ips:
            return True

        # 2. Check domain whitelist (Origin or Host)
        origin = request.headers.get("origin", "").lower()
        host = request.headers.get("host", "").lower()

        for d in self.frontend_whitelist_domains:
            if origin.endswith(d) or host.endswith(d):
                return True

        return False

    async def dispatch(self, request: Request, call_next: Callable) -> Response:

        # Extract client IP
        client_ip = self.ip_resolver.extract_client_ip(request)
        if not client_ip:
            client_ip = request.client.host if request.client else "0.0.0.0"

        region_code = self.ip_resolver.resolve_ip_to_region(
            client_ip, request.headers)

        # Get tier info
        tier_name = self.tier_engine.get_tier_for_region(region_code)
        allowed_categories = self.tier_engine.get_allowed_categories(
            region_code)
        blocked_categories = self.tier_engine.get_blocked_categories(
            region_code)
        restricted_categories = self.tier_engine.get_restricted_categories(
            region_code)

        # Attach to request state
        request.state.client_ip = client_ip
        request.state.region_code = region_code
        request.state.tier_name = tier_name
        request.state.allowed_categories = allowed_categories
        request.state.blocked_categories = blocked_categories
        request.state.restricted_categories = restricted_categories

        # logger.info(f"🌍 Geo resolved: IP={client_ip}, Region={region_code}, TierName={tier_name}")

        # BYPASS: frontend whitelist
        if self.is_frontend_request(request, client_ip):
            # logger.info(f"🟢 Frontend bypass active for IP={client_ip}, Host={request.headers.get('host')}")
            return await call_next(request)

        # Block full_block tier
        if tier_name == 'tier1':
            self.compliance_logger.log_access_blocked(
                ip=client_ip,
                region_code=region_code,
                reason=f"Access blocked for Tier 1 (full_block) region"
            )

            logger.warning(
                f"🚫 Blocked access from region {region_code} (Tier 1)")

            return JSONResponse(
                status_code=403,
                content={
                    "error": "access_denied",
                    "message": "Service is not available in your region",
                    "region": region_code
                }
            )

        return await call_next(request)


def create_geo_enforcement(app):
    """
    Add geo enforcement middleware to FastAPI app
    Order matters: resolve first, then block
    """
    app.add_middleware(GeoResolveMiddleware)

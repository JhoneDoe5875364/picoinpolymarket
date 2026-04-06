"""
GeoControl Middleware
Enforces geocontrol policies at the backend layer
"""
import os
from typing import Callable

from dotenv import load_dotenv
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.compliance_logger import log_access_blocked
from app.core.ip_resolver import get_ip_resolver
from app.core.logger import get_logger
from app.core.tier_engine import get_tier_engine

load_dotenv()

logger = get_logger()


class GeoResolveMiddleware(BaseHTTPMiddleware):
    """
    Middleware to resolve client region and attach to request state
    """

    def __init__(self, app):
        super().__init__(app)
        self.ip_resolver = get_ip_resolver()
        self.tier_engine = get_tier_engine()
        self.frontend_whitelist_domains = set(
            d.strip().lower()
            for d in os.getenv("FRONTEND_WHITELIST_DOMAINS", "").split(",")
            if d.strip()
        )
        self.frontend_whitelist_ips = set(
            ip.strip()
            for ip in os.getenv("FRONTEND_WHITELIST_IPS", "").split(",")
            if ip.strip()
        )

        logger.info("Loaded frontend whitelist domains: %s", self.frontend_whitelist_domains)
        logger.info("Loaded frontend whitelist IPs: %s", self.frontend_whitelist_ips)

    def is_frontend_request(self, request: Request, client_ip: str) -> bool:
        if client_ip in self.frontend_whitelist_ips:
            return True
        origin = request.headers.get("origin", "").lower()
        host = request.headers.get("host", "").lower()
        for d in self.frontend_whitelist_domains:
            if origin.endswith(d) or host.endswith(d):
                return True
        return False

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = self.ip_resolver.extract_client_ip(request)
        if not client_ip:
            client_ip = request.client.host if request.client else "0.0.0.0"

        region_code = self.ip_resolver.resolve_ip_to_region(client_ip, request.headers)
        tier_name = self.tier_engine.get_tier_for_region(region_code)
        allowed_categories = self.tier_engine.get_allowed_categories(region_code)
        blocked_categories = self.tier_engine.get_blocked_categories(region_code)
        restricted_categories = self.tier_engine.get_restricted_categories(region_code)

        request.state.client_ip = client_ip
        request.state.region_code = region_code
        request.state.tier_name = tier_name
        request.state.allowed_categories = allowed_categories
        request.state.blocked_categories = blocked_categories
        request.state.restricted_categories = restricted_categories

        if self.is_frontend_request(request, client_ip):
            return await call_next(request)

        if tier_name == "tier1":
            await log_access_blocked(
                request,
                ip=client_ip,
                region_code=region_code,
                reason="Access blocked for Tier 1 (full_block) region",
            )
            logger.warning("Blocked access from region %s (Tier 1)", region_code)
            return JSONResponse(
                status_code=403,
                content={
                    "error": "access_denied",
                    "message": "Service is not available in your region",
                    "region": region_code,
                },
            )

        return await call_next(request)


def create_geo_enforcement(app):
    app.add_middleware(GeoResolveMiddleware)

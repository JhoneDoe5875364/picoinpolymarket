"""
IP Resolver Module
Extracts client IP and resolves to region/state codes (Cloudflare compatible)
"""
from typing import Optional, Tuple, Dict
from functools import lru_cache
import os
from app.core.logger import get_logger

logger = get_logger()


class IPResolver:
    """Resolves client IP to region and state codes (with Cloudflare support)"""

    def extract_client_ip(self, request) -> Optional[str]:
        """
        Extract client IP from request.
        Cloudflare adds CF-Connecting-IP header.
        """
        if hasattr(request, 'headers'):
            # Cloudflare recommended header
            cf_ip = request.headers.get("CF-Connecting-IP")
            if cf_ip:
                return cf_ip

            forwarded_for = request.headers.get("X-Forwarded-For")
            if forwarded_for:
                return forwarded_for.split(",")[0].strip()

            real_ip = request.headers.get("X-Real-IP")
            if real_ip:
                return real_ip

        if hasattr(request, 'client') and request.client:
            return request.client.host

        return None
    
    def resolve_ip_to_region(self, ip: str, cf_headers: Dict[str, str] = None) -> str:
        """
        Resolve region/state using Cloudflare headers if available.
        Falls back to defaults.
        """
        # Localhost
        if not ip or ip in ('127.0.0.1', 'localhost', '::1'):
            return 'LOCAL'

        # If Cloudflare headers present, use them directly
        if cf_headers:
            country = cf_headers.get("cf-ipcountry")

            if country:
                return country

        # If Cloudflare headers missing → cannot resolve
        # logger.warning(f"!! No Cloudflare geo headers found for IP {ip}")
        return 'UNKNOWN'

    def resolve_ip(self, request) -> Dict[str, Optional[str]]:
        """
        Main resolver entry point.
        Uses Cloudflare headers if available.
        """
        ip = self.extract_client_ip(request)

        cf_headers = {}
        if hasattr(request, 'headers'):
            cf_headers = {k.lower(): v for k, v in request.headers.items()}

        region_code = self.resolve_ip_to_region(ip, cf_headers)

        return {
            "ip": ip,
            "region_code": region_code,
        }


def get_ip_resolver() -> IPResolver:
    return IPResolver()

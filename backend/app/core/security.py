# core.py
import os
import jwt
import time
import httpx
from fastapi import Request, HTTPException, Depends, status, Header
from typing import Optional
from app.core.logger import get_logger
from dotenv import load_dotenv

from app.core.config import Config

# Load environment variables
load_dotenv()

logger = get_logger()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "changeme")
JWT_ISSUER = os.getenv("JWT_ISSUER", "predictpix")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "predictpix-clients")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

ADMIN_JWT_TTL_MIN = int(os.getenv("ADMIN_JWT_TTL_MIN", "15"))   # short
USER_JWT_TTL_MIN = int(os.getenv("USER_JWT_TTL_MIN",  "360"))  # 6h

PI_API_BASE = "https://api.minepi.com"
PI_ME_URL = f"{PI_API_BASE}/v2/me"


def _decode_bearer_token(request: Request) -> dict:
    """Validate the Bearer JWT and return its payload. Never bypasses.

    Shared by verify_token and verify_token_strict so money-moving routes can
    require real auth even when ENVIRONMENT=development.
    """
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token",
        )

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
        )

        if payload.get("exp") < time.time():
            logger.error(f"[Verify Token]: Token expired for user {payload.get('sub')}")
            raise HTTPException(status_code=401, detail="Token expired")

        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


async def verify_token(request: Request):
    if Config.ENVIRONMENT == "development":
        return {
            "sub": "1", # "3"
            "username": "superadmin", # "dev_user"
            "role": "superadmin", # "user"
        }

    return _decode_bearer_token(request)


async def verify_token_strict(request: Request):
    """Auth for money-moving routes (A2U payouts / sells).

    Unlike verify_token, this NEVER honours the development bypass: an A2U payout
    sends real coins, so it must always be tied to a genuinely authenticated
    user, even on a dev/staging host. See V5 in the sell attack analysis.
    """
    return _decode_bearer_token(request)


async def optional_verify_token(request: Request) -> Optional[dict]:
    """
    Return JWT payload when a valid Bearer token is present; otherwise None.
    Never raises (unlike verify_token), so public routes can enrich responses for logged-in users.
    """
    if Config.ENVIRONMENT == "development":
        return {
            "sub": "1",
            "username": "superadmin",
            "role": "superadmin",
        }

    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
        )
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def mint_jwt_token(user_id, username, role, pi_access_token):
    now = int(time.time())
    if role == "superadmin":
        ttl_min = ADMIN_JWT_TTL_MIN
    elif role == "admin":
        ttl_min = ADMIN_JWT_TTL_MIN
    else:
        ttl_min = USER_JWT_TTL_MIN
    exp = now + ttl_min * 60
    payload = {
        "iss": JWT_ISSUER,                     # Issuer
        "aud": JWT_AUDIENCE,                   # Audience
        "sub": user_id,                        # Subject (user id)
        "username": username,                  # Username
        "role": role,                          # User role
        "iat": now,                            # Issued at
        "exp": exp,                            # Expiration
        "tok": pi_access_token
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


SUPERADMIN_ROLES: tuple[str, ...] = ("superadmin",)
ADMIN_ROLES: tuple[str, ...] = ("superadmin", "admin")


def _require_roles(user: dict, allowed: tuple[str, ...], detail: str) -> dict:
    # A bare ("superadmin") is a string, not a tuple, so `in` degrades into a
    # substring test and lets "admin", "super" and even "" through. Refuse to
    # run rather than silently authorise, should a caller ever pass one.
    if not isinstance(allowed, tuple):
        raise TypeError(f"allowed roles must be a tuple, got {type(allowed).__name__}")

    role = user.get("role")
    if not isinstance(role, str) or role not in allowed:
        raise HTTPException(status_code=403, detail=detail)
    return user


async def require_superadmin(user=Depends(verify_token)) -> dict:
    """Gate routes that settle money: market resolution, payouts, role changes."""
    return _require_roles(user, SUPERADMIN_ROLES, "HasNotSuperadminRole")


async def require_admin_role(user=Depends(verify_token)) -> dict:
    """Gate routes that manage content but do not settle money."""
    return _require_roles(user, ADMIN_ROLES, "HasNotAdminRole")


def require_admin(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """Legacy X-API-Key gate. Unrelated to the JWT role checks above."""
    want = os.getenv("ADMIN_API_KEY") or ""
    if not want or (x_api_key or "") != want:
        raise HTTPException(status_code=401, detail="Admin key invalid")
    return {"role": "admin"}


def require_tester(authorization: Optional[str] = Header(None, alias="Authorization")):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login required")
    handle = authorization.split(" ", 1)[1].strip()
    if not handle:
        raise HTTPException(status_code=401, detail="Login required")
    return {"role": "tester", "handle": handle}


async def _verify_with_pi(access_token: str) -> dict:
    """Verify Pi access token by calling /v2/me and return its JSON payload."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(PI_ME_URL, headers={"Authorization": f"Bearer {access_token}"})
    except Exception as e:
        return None

    if r.status_code != 200:
        return None

    try:
        data = r.json()
    except Exception:
        return None

    if not isinstance(data, dict):
        return None
    return data



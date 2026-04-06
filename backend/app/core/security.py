# core.py
import os
import jwt
import time
import httpx
from fastapi import Request, HTTPException, Depends, status, Header
from typing import Optional
from app.core.logger import get_logger
from dotenv import load_dotenv

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


async def verify_token(request: Request):
    auth_header = request.headers.get("authorization")
    
    # logger.info(f"[Verify Token]: JWT_SECRET_KEY={JWT_SECRET_KEY}, JWT_ISSUER={JWT_ISSUER}, JWT_AUDIENCE={JWT_AUDIENCE}, JWT_ALGORITHM={JWT_ALGORITHM}")

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
            audience=JWT_AUDIENCE
        )

        if payload.get("exp") < time.time():
            logger.error(f"[Verify Token]: Token expired for user {payload.get('sub')}")
            raise HTTPException(status_code=401, detail="Token expired")
        
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


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


def require_admin(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
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
        raise HTTPException(
            status_code=502, detail=f"Pi verify request failed: {e}")

    if r.status_code != 200:
        raise HTTPException(
            status_code=401, detail=f"Invalid Pi token: HTTP {r.status_code}")

    try:
        data = r.json()
    except Exception:
        raise HTTPException(
            status_code=502, detail="Pi verify returned invalid JSON")

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=502, detail="Pi verify returned unexpected structure")
    return data



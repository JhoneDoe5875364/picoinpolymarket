import httpx
import os
import jwt
import time
import random
import secrets
from fastapi import APIRouter, HTTPException, Request, Depends
from dotenv import load_dotenv
from typing import List
from datetime import datetime, timedelta
from psycopg2.extras import RealDictCursor
from app.core.security import verify_token, mint_jwt_token, _verify_with_pi
from app.core.database import _conn
from app.core.logger import get_logger
from app.schemas.pi_auth import PiAuthRequest, AuthResponse, VerifyRequest, VerifyResponse
from app.core.config import Config

# Load environment variables
load_dotenv()

logger = get_logger()

router = APIRouter(prefix="/auth/pi", tags=["auth"])

NONCE_EXPIRY_SECONDS = Config.NONCE_EXPIRY_SECONDS


# ---- Config (from /opt/predictpix/.env) -------------------------------------
PI_API_BASE = "https://api.minepi.com"
PI_ME_URL = f"{PI_API_BASE}/v2/me"

# comma/space separated usernames (Pi)
ADMIN_LIST = set((os.getenv("PREDICTPIX_ADMIN_PI_USERNAMES", "")
                 or "").replace(",", " ").split())


# WARNING: In-memory nonce store - not suitable for production
# Issues:
# 1. Lost on server restart
# 2. Not shared across multiple instances
# 3. No automatic expiration cleanup
# TODO: Replace with Redis or database-backed storage with TTL
nonce_store = {}


# ---- Route ------------------------------------------------------------------
@router.post("/", response_model=AuthResponse)
async def auth_pi(request: Request, body: PiAuthRequest):
    if not body.accessToken or not body.accessToken.strip():
        raise HTTPException(status_code=400, detail="missing accessToken")

    me = await _verify_with_pi(body.accessToken.strip())

    uid = str(me.get("uid") or me.get("id") or "")
    username = str(me.get("username") or "")
    if not uid or not username:
        raise HTTPException(
            status_code=502, detail="Pi response missing uid/username")

    roles = ["user"]
    if username in ADMIN_LIST:
        roles.append("admin")

    token = mint_jwt_token(uid=uid, username=username, role=roles)
    return {
        "access_token": token,
        "user": {
            "id": uid,
            "username": username,
            "roles": roles
        }
    }


@router.post("/start")
async def auth_pi_start():
    logger.info(f"[Auth Pi Start]")
    # 1. Create random nonce with 128bit
    nonce = secrets.token_hex(16)

    # 2. Store with expiration time (5 minutes)
    # WARNING: This is in-memory storage - see nonce_store declaration
    NONCE_EXPIRY_SECONDS = 300
    nonce_store[nonce] = time.time() + NONCE_EXPIRY_SECONDS

    return {"nonce": nonce}


@router.post("/verify")
async def auth_pi_verify(req: VerifyRequest):
    logger.info(f"[Auth Pi Verify]")
    nonce = req.nonce
    auth_result = req.authResult

    # 1. Validate the nonce
    if nonce not in nonce_store:
        raise HTTPException(status_code=400, detail="Invalid nonce")
    
    # 2. Check expiration
    if time.time() > nonce_store[nonce]:
        del nonce_store[nonce]
        raise HTTPException(status_code=400, detail="Nonce expired")

    # 2. Verify the Pi Network authResult (e.g., check if user_id exists)
    user = auth_result.get("user", {})
    user_id = user.get("uid")
    username = user.get("username", f"user_{user_id}")
    # roles = auth_result.get("roles", ["user"])
    pi_access_token = auth_result.get("accessToken", "")
    if not user_id:
        logger.error(f"Invalid authResult: {auth_result}")
        raise HTTPException(status_code=400, detail="Invalid auth result")

    # check user role
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, pi_username, role_id
            FROM users
            WHERE id = %s 
        """, (str(user_id),))
        user_row = cur.fetchone()

    if not user_row:
        with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO users (id, pi_username, role_id, status) VALUES (%s, %s, %s, %s)
                RETURNING id, pi_username, role_id
            """, (str(user_id), username, 3, 'active'))
            user_row = cur.fetchone()

            if not user_row:
                raise HTTPException(status_code=502, detail="User not created")

    role = ""
    if user_row.get("role_id") == 1:
        role = "superadmin"
    elif user_row.get("role_id") == 2:
        role = "admin"
    else:
        role = "user"

    # 3. Create a JWT token with full claims
    token = mint_jwt_token(user_id, username, role, pi_access_token)

    # 4. Remove the nonce after use
    if nonce in nonce_store:
        del nonce_store[nonce]
    
    # Cleanup expired nonces (simple cleanup - should be done periodically in production)
    current_time = time.time()
    expired_nonces = [n for n, exp_time in nonce_store.items() if current_time > exp_time]
    for expired_nonce in expired_nonces:
        del nonce_store[expired_nonce]

    return {
        "ok": True,
        "accessToken": token,
        "user_id": user_row.get("id", ""),
        "username": user_row.get("pi_username", ""),
        "role": role
    }


@router.get("/me")
async def auth_pi_me(user=Depends(verify_token)):
    """
    Verify the Pi access token validity by checking it against Pi API.
    This endpoint checks both the JWT token and the underlying Pi access token.
    Returns 401 if either token is invalid.
    """
    # Extract Pi access token from JWT payload
    pi_access_token = user.get("tok")
    
    if not pi_access_token:
        raise HTTPException(
            status_code=401, 
            detail="Pi access token not found in JWT"
        )
    
    # Verify the Pi access token with Pi API
    try:
        me = await _verify_with_pi(pi_access_token)
        return {
            "ok": True,
            "user": {
                "id": user.get("sub"),
                "username": user.get("username"),
                "role": user.get("role")
            },
            "pi_user": {
                "uid": me.get("uid") or me.get("id"),
                "username": me.get("username")
            }
        }
    except HTTPException as e:
        # Re-raise HTTP exceptions (401, 502, etc.)
        raise e
    except Exception as e:
        logger.error(f"Error verifying Pi token: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Failed to verify Pi access token"
        )


@router.get("/protected")
async def protected_route(user=Depends(verify_token)):
    return {
        "message": f"Hello {user['username']}!",
        "user_id": user["sub"],
        "role": user["role"]
    }

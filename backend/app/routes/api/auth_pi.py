import os
import secrets
import time

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Config
from app.core.logger import get_logger
from app.core.security import _verify_with_pi, mint_jwt_token, verify_token
from app.db.deps import DbSession
from app.repositories import auth as auth_repo
from app.schemas.pi_auth import AuthResponse, PiAuthRequest, VerifyRequest

load_dotenv()

logger = get_logger()

router = APIRouter(prefix="/auth/pi", tags=["auth"])

NONCE_EXPIRY_SECONDS = Config.NONCE_EXPIRY_SECONDS
PI_API_BASE = "https://api.minepi.com"
PI_ME_URL = f"{PI_API_BASE}/v2/me"
ADMIN_LIST = set(
    (os.getenv("PREDICTPIX_ADMIN_PI_USERNAMES", "") or "").replace(",", " ").split()
)
nonce_store = {}


@router.post("/", response_model=AuthResponse)
async def auth_pi(body: PiAuthRequest):
    if not body.accessToken or not body.accessToken.strip():
        raise HTTPException(status_code=400, detail="missing accessToken")

    me = await _verify_with_pi(body.accessToken.strip())
    uid = str(me.get("uid") or me.get("id") or "")
    username = str(me.get("username") or "")
    if not uid or not username:
        raise HTTPException(status_code=502, detail="Pi response missing uid/username")

    roles = ["user"]
    if username in ADMIN_LIST:
        roles.append("admin")
    role_str = "admin" if "admin" in roles else "user"
    token = mint_jwt_token(uid, username, role_str, body.accessToken.strip())
    return {
        "access_token": token,
        "user": {"id": uid, "username": username, "roles": roles},
    }


@router.post("/start")
async def auth_pi_start():
    nonce = secrets.token_hex(16)
    nonce_store[nonce] = time.time() + NONCE_EXPIRY_SECONDS
    return {"nonce": nonce}


@router.post("/verify")
async def auth_pi_verify(req: VerifyRequest, db: DbSession):
    nonce = req.nonce
    auth_result = req.authResult

    if nonce not in nonce_store:
        raise HTTPException(status_code=400, detail="Invalid nonce")
    if time.time() > nonce_store[nonce]:
        del nonce_store[nonce]
        raise HTTPException(status_code=400, detail="Nonce expired")

    user = auth_result.get("user", {})
    user_id = user.get("uid")
    username = user.get("username", f"user_{user_id}")
    pi_access_token = auth_result.get("accessToken", "")
    if not user_id:
        logger.error("Invalid authResult: %s", auth_result)
        raise HTTPException(status_code=400, detail="Invalid auth result")

    user_row = await auth_repo.get_user_by_id(db, str(user_id))
    if not user_row:
        async with db.begin():
            user_row = await auth_repo.insert_user(
                db, user_id=str(user_id), username=username
            )

    if user_row.get("role_id") == 1:
        role = "superadmin"
    elif user_row.get("role_id") == 2:
        role = "admin"
    else:
        role = "user"

    token = mint_jwt_token(str(user_row["id"]), username, role, pi_access_token)
    if nonce in nonce_store:
        del nonce_store[nonce]

    current_time = time.time()
    for expired_nonce in [n for n, exp in nonce_store.items() if current_time > exp]:
        del nonce_store[expired_nonce]

    return {
        "ok": True,
        "accessToken": token,
        "user_id": user_row.get("id", ""),
        "username": user_row.get("pi_username", ""),
        "role": role,
    }


@router.get("/me")
async def auth_pi_me(user=Depends(verify_token)):
    pi_access_token = user.get("tok")
    if not pi_access_token:
        raise HTTPException(status_code=401, detail="Pi access token not found in JWT")
    try:
        me = await _verify_with_pi(pi_access_token)
        return {
            "ok": True,
            "user": {
                "id": user.get("sub"),
                "username": user.get("username"),
                "role": user.get("role"),
            },
            "pi_user": {
                "uid": me.get("uid") or me.get("id"),
                "username": me.get("username"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error verifying Pi token: %s", e)
        raise HTTPException(status_code=401, detail="Failed to verify Pi access token")


@router.get("/protected")
async def protected_route(user=Depends(verify_token)):
    return {
        "message": f"Hello {user['username']}!",
        "user_id": user["sub"],
        "role": user["role"],
    }

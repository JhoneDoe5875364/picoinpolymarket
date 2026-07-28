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
from app.schemas.pi_auth import VerifyRequest

load_dotenv()

logger = get_logger()

router = APIRouter(prefix="/auth/pi", tags=["auth"])


@router.post("/verify")
async def auth_pi_verify(req: VerifyRequest, db: DbSession):
    auth_result = req.authResult

    user = auth_result.get("user", {})
    # Pi's /me and authenticate() return the identifier as "uid"; keep "id" as a
    # fallback for any caller that already normalized it.
    user_id = user.get("uid") or user.get("id")
    username = user.get("username", f"user_{user_id}")

    # verify pi access token
    pi_access_token = auth_result.get("accessToken", "")
    me = await _verify_with_pi(pi_access_token)
    if not me:
        raise HTTPException(status_code=401, detail="Invalid Pi access token")

    if not user_id:
        logger.error("Invalid authResult: %s", auth_result)
        raise HTTPException(status_code=400, detail="Invalid auth result")

    user_row = await auth_repo.get_user_by_id(db, str(user_id))
    # The read above autobegins a transaction (SQLAlchemy 2.0); close it before
    # opening an explicit one below, or db.begin() raises "already begun".
    await db.rollback()
    if not user_row:
        async with db.begin():
            user_row = await auth_repo.insert_user(
                db, user_id=str(user_id), username=username
            )
            await auth_repo.touch_login_timestamp(db, int(user_row["id"]))
    else:
        async with db.begin():
            await auth_repo.touch_login_timestamp(db, int(user_row["id"]))

    if user_row.get("role_id") == 1:
        role = "superadmin"
    elif user_row.get("role_id") == 2:
        role = "admin"
    else:
        role = "user"

    token = mint_jwt_token(str(user_row["id"]), username, role, pi_access_token)

    return {
        "ok": True,
        "ppx_user": {
            # Frontend PpxUser reads `id`; keep `uid` for any older caller.
            "id": user_row.get("id", ""),
            "uid": user_row.get("id", ""),
            "username": user_row.get("pi_username", ""),
            "role": role,
        },
        "ppx_token": token,
    }


@router.get("/me")
async def auth_pi_me(user=Depends(verify_token)):
    # for test
    if Config.ENVIRONMENT == "development":
        return {
            "ok": True,
            "user": {
                "id": user.get("sub"),
                "username": user.get("username"),
                "role": user.get("role"),
            },
            "pi_user": {
                "uid": "test-uid",
                "username": user.get("username"),
            },
        }
    
    pi_access_token = user.get("tok")
    if not pi_access_token:
        raise HTTPException(status_code=401, detail="Pi access token not found in JWT")
    try:
        me = await _verify_with_pi(pi_access_token)
        if not me:
            raise HTTPException(status_code=401, detail="Invalid Pi access token")
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


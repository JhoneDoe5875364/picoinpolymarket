from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import account as account_repo

logger = get_logger()

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/info")
async def get_user_info(db: DbSession, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    role = user.get("role", "")
    user_row = await account_repo.user_info_row(db, user_id)
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "ok": True,
        "info": {
            "id": user_row.get("id"),
            "pi_username": user_row.get("pi_username"),
            "created_at": user_row.get("created_at"),
            "referral_code": user_row.get("referral_code"),
            "referred_by": user_row.get("referred_by"),
            "role": role,
        },
    }


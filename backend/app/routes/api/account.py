from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import account as account_repo

logger = get_logger()

router = APIRouter(prefix="/account", tags=["account"])


@router.post("/wallet")
async def set_wallet(request: Request, db: DbSession, user=Depends(verify_token)):
    """Save the user's payout wallet address (they enter it themselves)."""
    user_id = user.get("sub", "")
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    try:
        wallet_address = account_repo.normalize_wallet_address(
            (data or {}).get("wallet_address")
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        row = await account_repo.set_wallet_address(
            db, user_id=str(user_id), wallet_address=wallet_address
        )
    except LookupError:
        raise HTTPException(status_code=404, detail="User not found")

    return {"ok": True, "wallet_address": row["wallet_address"]}


@router.get("/info")
async def get_user_info(db: DbSession, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    role = user.get("role", "")
    user_row = await account_repo.user_info_row(db, user_id)
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    wallet_address = user_row.get("wallet_address")
    return {
        "ok": True,
        "info": jsonable_encoder(
            {
                "id": user_row.get("id"),
                "pi_uid": user_row.get("pi_uid"),
                "pi_username": user_row.get("pi_username"),
                "wallet_address": wallet_address,
                "payout_destination": wallet_address,
                "wallet_record_updated_at": user_row.get("wallet_record_updated_at"),
                "last_pi_verified_at": user_row.get("updated_at"),
                "created_at": user_row.get("created_at"),
                "referral_code": user_row.get("referral_code"),
                "referred_by": user_row.get("referred_by"),
                "role": role,
            }
        ),
    }


from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder

from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession
from app.repositories import account as account_repo

logger = get_logger()

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/open-positions")
async def get_open_positions(db: DbSession, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    rows = await account_repo.open_positions(db, user_id)
    return {"ok": True, "rows": jsonable_encoder(rows)}


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


@router.get("/recent-activity")
async def get_recent_activity(db: DbSession, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    rows = await account_repo.recent_activity(db, user_id)
    return {"ok": True, "rows": jsonable_encoder(rows)}


@router.get("/history")
async def get_history(db: DbSession, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    rows = await account_repo.transaction_history(db, user_id)
    return {"ok": True, "rows": jsonable_encoder(rows)}


@router.post("/claim")
async def handle_claim(db: DbSession, user=Depends(verify_token)):
    user_id = user.get("sub", "")
    try:
        async with db.begin():
            total_balance, claimable_balance = await account_repo.claim_payouts_flow(
                db, user_id
            )
    except LookupError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error("Error claiming payouts: %s", e)
        raise HTTPException(status_code=500, detail="Failed to claim payouts")

    if claimable_balance <= 0:
        return {
            "ok": True,
            "total_balance": total_balance,
            "claimed_rewards": 0,
            "claimable_balance": 0,
        }

    return {
        "ok": True,
        "total_balance": total_balance,
        "claimed_rewards": claimable_balance,
        "claimable_balance": 0,
    }
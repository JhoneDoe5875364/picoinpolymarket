"""
Attestation API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from app.core.attestation import create_attestation, get_latest_attestation, has_valid_attestation
from app.core.logger import get_logger
from app.core.security import verify_token
from app.db.deps import DbSession

logger = get_logger()

router = APIRouter(prefix="/attestation", tags=["attestation"])


class AttestationRequest(BaseModel):
    confirmed: bool
    user_id: str


class AttestationResponse(BaseModel):
    success: bool
    message: str
    attestation_version: str


class AttestationStatusResponse(BaseModel):
    user_id: str
    has_valid_attestation: bool
    last_attestation: Optional[dict]


@router.post("/confirm", response_model=AttestationResponse)
async def confirm_attestation(
    request: Request,
    body: AttestationRequest,
    db: DbSession,
    user=Depends(verify_token),
) -> AttestationResponse:
    if not body.confirmed:
        raise HTTPException(
            status_code=400,
            detail="Attestation must be confirmed to proceed",
        )
    token_sub = str(user.get("sub") or "")
    if body.user_id != token_sub:
        raise HTTPException(status_code=403, detail="user_id does not match authenticated user")

    try:
        async with db.begin():
            await create_attestation(
                db,
                user_id=body.user_id,
                ip=request.state.client_ip,
                region_code=getattr(request.state, "region_code", "UNKNOWN"),
                state_code=getattr(request.state, "state_code", None),
                attestation_version="1.0",
            )
    except Exception as e:
        logger.error("Failed to record attestation: %s", e)
        raise HTTPException(status_code=500, detail="Failed to record attestation")

    logger.info("Attestation confirmed for user %s", body.user_id)
    return AttestationResponse(
        success=True,
        message="Attestation recorded successfully",
        attestation_version="1.0",
    )


@router.get("/status/{user_id}", response_model=AttestationStatusResponse)
async def get_attestation_status(user_id: str, db: DbSession) -> AttestationStatusResponse:
    has_valid = await has_valid_attestation(db, user_id)
    last_attestation = await get_latest_attestation(db, user_id)
    return AttestationStatusResponse(
        user_id=user_id,
        has_valid_attestation=has_valid,
        last_attestation=last_attestation,
    )


@router.get("/check")
async def check_attestation_required(request: Request):
    tier = getattr(request.state, "tier_name", "UNKNOWN")
    region_code = getattr(request.state, "region_code", "UNKNOWN")
    is_required = tier == "tier1"
    return {
        "attestation_required": is_required,
        "tier": tier,
        "region": region_code,
        "message": "I confirm that I am not accessing this service from a restricted region.",
    }

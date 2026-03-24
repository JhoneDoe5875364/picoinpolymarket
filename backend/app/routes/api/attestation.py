"""
Attestation API Routes
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.attestation import get_attestation_service
from app.core.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/attestation", tags=["attestation"])


class AttestationRequest(BaseModel):
    """Attestation confirmation request"""
    confirmed: bool
    user_id: str


class AttestationResponse(BaseModel):
    """Attestation response"""
    success: bool
    message: str
    attestation_version: str


class AttestationStatusResponse(BaseModel):
    """Attestation status response"""
    user_id: str
    has_valid_attestation: bool
    last_attestation: Optional[dict]


@router.post("/confirm", response_model=AttestationResponse)
async def confirm_attestation(
    request: Request,
    body: AttestationRequest
) -> AttestationResponse:
    """
    Record user attestation confirmation
    Required: "I confirm that I am not accessing this service from a restricted region."
    """
    if not body.confirmed:
        raise HTTPException(
            status_code=400,
            detail="Attestation must be confirmed to proceed"
        )
    
    attestation_service = get_attestation_service()
    
    success = await attestation_service.create_attestation(
        user_id=body.user_id,
        ip=request.state.client_ip,
        region_code=getattr(request.state, 'region_code', 'UNKNOWN'),
        state_code=getattr(request.state, 'state_code', None),
        attestation_version="1.0"
    )
    
    if success:
        logger.info(f"✅ Attestation confirmed for user {body.user_id}")
        return AttestationResponse(
            success=True,
            message="Attestation recorded successfully",
            attestation_version="1.0"
        )
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to record attestation"
        )


@router.get("/status/{user_id}", response_model=AttestationStatusResponse)
async def get_attestation_status(
    request: Request,
    user_id: str
) -> AttestationStatusResponse:
    """
    Get attestation status for a user
    """
    attestation_service = get_attestation_service()
    
    has_valid = await attestation_service.has_valid_attestation(user_id)
    last_attestation = await attestation_service.get_latest_attestation(user_id)
    
    return AttestationStatusResponse(
        user_id=user_id,
        has_valid_attestation=has_valid,
        last_attestation=last_attestation
    )


@router.get("/check")
async def check_attestation_required(request: Request):
    """
    Check if attestation is required for current user
    """
    tier = getattr(request.state, 'tier', 'UNKNOWN')
    region_code = getattr(request.state, 'region_code', 'UNKNOWN')
    
    # Attestation required for restricted/limited regions
    is_required = tier in ['restricted', 'full_block']
    
    return {
        "attestation_required": is_required,
        "tier": tier,
        "region": region_code,
        "message": "I confirm that I am not accessing this service from a restricted region."
    }

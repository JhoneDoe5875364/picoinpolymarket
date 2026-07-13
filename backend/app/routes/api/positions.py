"""Positions are created by settlement, never by the client.

`POST /positions` used to mint a position from an unauthenticated-payment request
body, which let any holder of a valid JWT open a position without paying. Shares
are now issued only inside `POST /pi/payments/complete`, in the same transaction
that marks the Pi payment COMPLETED and the order EXECUTED.

Read paths for positions live under /markets/positions and /users/positions.
"""

from fastapi import APIRouter, HTTPException

from app.core.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/positions", tags=["positions"])


@router.post("/", deprecated=True, include_in_schema=False)
async def create_position_removed():
    raise HTTPException(
        status_code=410,
        detail=(
            "Positions are created by payment settlement. "
            "Use POST /pi/payments/approve then POST /pi/payments/complete."
        ),
    )

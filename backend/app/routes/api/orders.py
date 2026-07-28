from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from app.core.logger import get_logger
from app.core.security import verify_token
from app.core.trade import compute_trade_breakdown, validate_breakdown_fields
from app.db.deps import DbSession
from app.repositories import auth as auth_repo
from app.repositories import markets as markets_repo
from app.repositories import orders as orders_repo

logger = get_logger()

router = APIRouter(prefix="/orders", tags=["orders"])


class CancelOrdersRequest(BaseModel):
    order_ids: list[int] = Field(..., min_length=1, max_length=3000)


class CancelMarketOrdersRequest(BaseModel):
    market_id: int = Field(..., ge=1)


class CreateOrderRequest(BaseModel):
    user_id: int = Field(..., ge=1)
    market_id: int = Field(..., ge=1)
    side: Literal["BUY", "SELL"]
    outcome: Literal["YES", "NO"]
    price: float = Field(..., gt=0)
    size: float = Field(..., gt=0)
    amount: Optional[float] = Field(default=None, gt=0)
    fee: Optional[float] = Field(default=None, ge=0)
    total_cost: Optional[float] = Field(default=None, gt=0)


@router.get("/", summary="Get orders")
async def get_user_orders(
    db: DbSession,
    user_id: int = Query(..., ge=1),
):
    try:
        rows = await orders_repo.get_user_orders(db, user_id=user_id)
        return {"ok": True, "data": jsonable_encoder(rows)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/", summary="Create order")
async def create_order(
    db: DbSession,
    payload: CreateOrderRequest,
    user=Depends(verify_token),
):
    try:
        token_user_id = user.get("sub")
        if token_user_id is not None and str(token_user_id) != str(payload.user_id):
            raise HTTPException(status_code=403, detail="user_id does not match token")

        user_row = await auth_repo.get_user_by_id(db, str(payload.user_id))
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        market = await markets_repo.get_market_by_id(db, payload.market_id)
        if not market:
            raise HTTPException(status_code=404, detail="Market not found")

        # Only open markets accept trades. A closed/pending/resolved market must
        # not be buyable — otherwise users could bet after the outcome is known.
        market_status = await orders_repo.get_market_status(db, payload.market_id)
        if market_status != "open":
            raise HTTPException(
                status_code=400,
                detail="This market is closed and no longer accepts predictions.",
            )

        breakdown = compute_trade_breakdown(payload.price, payload.size)
        validate_breakdown_fields(
            amount=payload.amount,
            fee=payload.fee,
            total_cost=payload.total_cost,
            breakdown=breakdown,
        )

        row = await orders_repo.create_order(
            db,
            user_id=payload.user_id,
            market_id=payload.market_id,
            side=payload.side,
            outcome=payload.outcome,
            price=payload.price,
            size=payload.size,
        )
        return {"ok": True, "data": jsonable_encoder(row), "breakdown": breakdown.as_dict()}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{order_id:int}", summary="Get order by id")
async def get_order_by_id(order_id: int, db: DbSession):
    try:
        row = await orders_repo.get_order_by_id(db, order_id=order_id)
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        return {
            "ok": True,
            "data": jsonable_encoder(row),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/", summary="Cancel orders")
async def cancel_orders(payload: CancelOrdersRequest, db: DbSession):
    result = await orders_repo.cancel_orders(db, order_ids=payload.order_ids)
    return {"ok": True, "data": jsonable_encoder(result)}


@router.delete("/cancel-all", summary="Cancel all open orders")
async def cancel_all_open_orders(db: DbSession, user=Depends(verify_token)):
    pi_uid = user.get("sub", "")
    user_row = await auth_repo.get_user_by_id(db, pi_uid)
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")

    result = await orders_repo.cancel_all_open_orders_by_user(
        db,
        user_id=user_row["id"],
    )
    return {"ok": True, "data": jsonable_encoder(result)}


@router.delete("/cancel-market-orders", summary="Cancel market open orders")
async def cancel_market_open_orders(
    db: DbSession,
    user_id: int = Query(..., ge=1),
    market_id: int = Query(..., ge=1),
):
    result = await orders_repo.cancel_open_orders_by_user_and_market(
        db,
        user_id=user_id,
        market_id=market_id,
    )
    return {"ok": True, "data": jsonable_encoder(result)}


@router.delete("/{order_id:int}", summary="Cancel order")
async def cancel_order(order_id: int, db: DbSession):
    try:
        row = await orders_repo.cancel_order(db, order_id=order_id)
        return {"ok": True, "data": jsonable_encoder(row)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

"""Positions are created by settlement, never by the client.

`POST /positions` used to mint a position from an unauthenticated-payment request
body, which let any holder of a valid JWT open a position without paying. Shares
are now issued only inside `POST /pi/payments/complete`, in the same transaction
that marks the Pi payment COMPLETED and the order EXECUTED.

Selling is the payout direction: `POST /positions/{id}/sell` reduces a holding at
the current market price and returns the proceeds to the user's wallet via A2U,
with no human/admin step. See docs/feedbacks/20260729_Sell_Feature_Design.ko.md.

Read paths for positions live under /markets/positions and /users/positions.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field

from app.core import pi_a2u
from app.core.config import Config
from app.core.logger import get_logger
from app.core.market import insert_market_trade, reduce_market_position, update_market_price
from app.core.security import verify_token
from app.core.trade import compute_sell_breakdown
from app.db.deps import DbSession
from app.repositories import markets as markets_repo
from app.repositories import orders as orders_repo
from app.repositories import payments as payments_repo
from app.repositories import positions as positions_repo
from app.repositories import sell_settlements as sell_repo

logger = get_logger()

router = APIRouter(prefix="/positions", tags=["positions"])

# How far the live price may drift from the price the user saw before we reject
# the sell as "price moved". Relative tolerance.
SELL_PRICE_TOLERANCE = Decimal("0.02")


def _user_id(user: dict) -> int:
    raw = user.get("sub")
    try:
        return int(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Unauthorized: invalid user id in token")


class SellPositionRequest(BaseModel):
    sell_shares: float = Field(..., gt=0)
    expected_price: float | None = Field(default=None, gt=0)
    sell_request_id: str = Field(..., min_length=8, max_length=64)


@router.post("/", deprecated=True, include_in_schema=False)
async def create_position_removed():
    raise HTTPException(
        status_code=410,
        detail=(
            "Positions are created by payment settlement. "
            "Use POST /pi/payments/approve then POST /pi/payments/complete."
        ),
    )


@router.post("/{position_id}/sell", summary="Sell (close) a position for an A2U payout")
async def sell_position(
    payload: SellPositionRequest,
    db: DbSession,
    position_id: int = Path(..., ge=1),
    user=Depends(verify_token),
):
    """Close all or part of a holding at the current price; pay proceeds via A2U.

    Order of operations (see design doc): validate + price + record a PENDING
    SELL order and settlement in transaction A, send Pi OUTSIDE any transaction,
    then reduce the position and finalize in transaction B. The user's shares are
    never reduced unless the payout was actually sent.
    """
    user_id = _user_id(user)

    if not Config.a2u_enabled():
        raise HTTPException(
            status_code=503,
            detail="Selling is temporarily unavailable (auto-payout disabled).",
        )

    # Idempotency: a retried request must not send Pi twice.
    existing = await sell_repo.get_by_request_id(db, sell_request_id=payload.sell_request_id)
    await db.rollback()
    if existing is not None:
        if existing["status"] == "SETTLED":
            return {
                "ok": True,
                "already": True,
                "txid": existing["payout_txid"],
                "net_payout": existing["net_payout"],
            }
        if existing["status"] == "PENDING":
            raise HTTPException(status_code=409, detail="This sell is already being processed.")
        raise HTTPException(status_code=409, detail="This sell already failed; use a new request id.")

    sell_shares = Decimal(str(payload.sell_shares))

    # ----- Transaction A: lock, validate, price, PENDING order + settlement -----
    try:
        async with db.begin():
            position = await positions_repo.lock_position(
                db, position_id=position_id, user_id=user_id
            )
            if position is None:
                raise HTTPException(status_code=404, detail="Position not found")
            if position.is_closed or Decimal(str(position.shares)) <= 0:
                raise HTTPException(status_code=400, detail="Position is already closed")
            if sell_shares > Decimal(str(position.shares)):
                raise HTTPException(status_code=400, detail="Sell exceeds holdings")

            market_id = int(position.market_id)
            outcome = str(position.outcome).upper()

            market_status = await orders_repo.get_market_status(db, market_id)
            if market_status != "open":
                raise HTTPException(
                    status_code=400,
                    detail="This market is closed and no longer accepts trades.",
                )

            token, price = await markets_repo.get_token_and_price(db, market_id, outcome)
            if price <= 0:
                raise HTTPException(status_code=400, detail="Invalid market price")

            if payload.expected_price is not None:
                expected = Decimal(str(payload.expected_price))
                drift = abs(price - expected)
                if expected > 0 and (drift / expected) > SELL_PRICE_TOLERANCE:
                    raise HTTPException(
                        status_code=409,
                        detail="Price moved. Refresh and try again.",
                    )

            breakdown = compute_sell_breakdown(float(price), float(sell_shares))

            pi_uid = await payments_repo.get_user_pi_uid(db, user_id=user_id)
            if not pi_uid:
                raise HTTPException(
                    status_code=400,
                    detail="No linked Pi wallet. Please log in again to grant wallet access.",
                )

            order = await sell_repo.create_sell_order(
                db,
                user_id=user_id,
                market_id=market_id,
                token=token,
                outcome=outcome,
                price=breakdown.price,
                shares=breakdown.shares,
            )
            await sell_repo.create_pending(
                db,
                sell_request_id=payload.sell_request_id,
                order_id=int(order.id),
                position_id=position_id,
                user_id=user_id,
                market_id=market_id,
                outcome=outcome,
                sell_shares=breakdown.shares,
                price=breakdown.price,
                net_payout=breakdown.net_payout,
            )
            order_id = int(order.id)
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - unexpected
        logger.error("[SELL] pre-send failed for position %s: %s", position_id, exc)
        raise HTTPException(status_code=500, detail="Failed to prepare sell") from exc

    # ----- Send Pi (A2U), OUTSIDE any DB transaction -----
    try:
        txid = await pi_a2u.send_payout(
            amount=float(breakdown.net_payout),
            uid=str(pi_uid),
            memo="PredictPix sell",
            metadata={"order_id": order_id, "kind": "sell", "position_id": position_id},
        )
    except pi_a2u.A2UError as exc:
        logger.error("[SELL] payout send failed for position %s: %s", position_id, exc)
        try:
            async with db.begin():
                await sell_repo.mark_failed(
                    db, sell_request_id=payload.sell_request_id, reason=str(exc)
                )
                await payments_repo.set_order_status(db, order_id=order_id, status="FAILED")
        except Exception:  # pragma: no cover - best-effort cleanup
            logger.error("[SELL] failed to mark settlement FAILED for %s", position_id)
        # Nothing was reduced; the user's position is intact.
        raise HTTPException(status_code=502, detail=f"Payout failed: {exc}") from exc

    # ----- Transaction B: reduce position, record trade, price, finalize -----
    try:
        async with db.begin():
            now = datetime.now(timezone.utc)
            trade = await insert_market_trade(
                db,
                user_id,
                market_id,
                outcome,
                breakdown.shares,
                now,
                side="SELL",
            )
            reduce_result = await reduce_market_position(
                db,
                market_id=market_id,
                user_id=user_id,
                outcome=outcome,
                sell_shares=breakdown.shares,
                updated_at=now,
            )
            await update_market_price(db, trade)
            await payments_repo.set_order_status(db, order_id=order_id, status="EXECUTED")
            await sell_repo.mark_settled(db, sell_request_id=payload.sell_request_id, txid=txid)
    except Exception as exc:
        # The Pi was already sent. Record txid on the settlement so it can be
        # reconciled: money left the wallet but the position was not reduced.
        logger.error(
            "[SELL] SENT but settle failed. position=%s order=%s txid=%s err=%s",
            position_id, order_id, txid, exc,
        )
        try:
            async with db.begin():
                await sell_repo.mark_failed(
                    db,
                    sell_request_id=payload.sell_request_id,
                    reason=f"settle_after_send: {exc}",
                    txid=txid,
                )
        except Exception:  # pragma: no cover
            pass
        raise HTTPException(
            status_code=500,
            detail=(
                f"Payout was sent (txid {txid}) but recording it failed. "
                "Contact support with this reference."
            ),
        ) from exc

    logger.info(
        "[SELL] position=%s user=%s shares=%s net=%s txid=%s",
        position_id, user_id, breakdown.shares, breakdown.net_payout, txid,
    )
    return {
        "ok": True,
        "txid": txid,
        "net_payout": float(breakdown.net_payout),
        "price": float(breakdown.price),
        "shares_sold": float(breakdown.shares),
        "remaining_shares": reduce_result["remaining_shares"],
        "is_closed": reduce_result["is_closed"],
    }

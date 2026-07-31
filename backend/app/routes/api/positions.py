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

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel, Field

from app.core import pi_a2u
from app.core.config import Config
from app.core.logger import get_logger
from app.core.market import (
    credit_escrow_pool_reversal,
    deduct_from_escrow_pool,
    insert_market_trade,
    reduce_market_position,
    restore_market_position,
    update_market_price,
)
from app.core.security import verify_token_strict
from app.core.trade import compute_pool_sell_price, compute_sell_breakdown
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
    user=Depends(verify_token_strict),
):
    """Close all or part of a holding at the current price; pay proceeds via A2U.

    Safe order of operations (closes the double-spend window — see V1/V2 in the
    sell attack analysis):

      Tx A (single atomic transaction, BEFORE any payout):
        - insert the settlement idempotently (ON CONFLICT DO NOTHING); a losing
          concurrent duplicate creates no row and is rejected without paying.
        - lock the position (FOR UPDATE), validate, price it, and REDUCE it now.
        - record the SELL trade, update price, mark the order EXECUTED,
          settlement = PAYING.
      Send Pi (A2U), OUTSIDE the transaction.
      Tx C: on success mark SETTLED(txid); on failure RESTORE the shares and
            mark FAILED — the user keeps exactly what they had.

    Because the shares are already gone when the payout is sent, a second
    concurrent sell of the same position fails "Sell exceeds holdings" instead of
    triggering a second payout.
    """
    user_id = _user_id(user)

    if not Config.a2u_enabled():
        raise HTTPException(
            status_code=503,
            detail="Selling is temporarily unavailable (auto-payout disabled).",
        )

    # V7: reject dust and enforce a minimum sell size before doing any work.
    if payload.sell_shares < Config.SELL_MIN_SHARES:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum sell is {Config.SELL_MIN_SHARES} shares.",
        )

    # Fast idempotency short-circuit for an already-finished request. This is an
    # optimization only; the authoritative guard is the ON CONFLICT insert below.
    existing = await sell_repo.get_by_request_id(db, sell_request_id=payload.sell_request_id)
    if existing is None:
        # V7: per-user rate limit (only for genuinely new requests, so a retry of
        # the same idempotency key is never rate-limited).
        recent = await sell_repo.count_recent_sells(
            db,
            user_id=user_id,
            window_seconds=Config.SELL_RATE_WINDOW_SECONDS,
        )
        if recent >= Config.SELL_RATE_MAX:
            await db.rollback()
            raise HTTPException(
                status_code=429,
                detail="Too many sells in a short period. Please wait and try again.",
            )
    await db.rollback()
    if existing is not None:
        if existing["status"] == "SETTLED":
            return {
                "ok": True,
                "already": True,
                "txid": existing["payout_txid"],
                "net_payout": existing["net_payout"],
            }
        if existing["status"] in ("PENDING", "PAYING"):
            raise HTTPException(status_code=409, detail="This sell is already being processed.")
        raise HTTPException(status_code=409, detail="This sell already failed; use a new request id.")

    sell_shares = Decimal(str(payload.sell_shares))

    # ----- Transaction A: reserve idempotently, reduce position, record -----
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
            position_avg_price = Decimal(str(position.avg_price))

            # V4/V6: round-trip cooldown — a position opened moments ago cannot be
            # sold, blocking pump-buy-then-dump wash trades against the app wallet.
            if Config.SELL_COOLDOWN_SECONDS > 0 and position.created_at is not None:
                age = (datetime.now(timezone.utc) - position.created_at).total_seconds()
                if age < Config.SELL_COOLDOWN_SECONDS:
                    raise HTTPException(
                        status_code=409,
                        detail="This position was opened too recently to sell. Try again shortly.",
                    )

            market_status = await orders_repo.get_market_status(db, market_id)
            if market_status != "open":
                raise HTTPException(
                    status_code=400,
                    detail="This market is closed and no longer accepts trades.",
                )

            # V4: refuse to sell into a market too thin to price safely.
            if Config.SELL_MIN_MARKET_LIQUIDITY > 0:
                liquidity = await markets_repo.get_market_liquidity(db, market_id)
                if liquidity < Decimal(str(Config.SELL_MIN_MARKET_LIQUIDITY)):
                    raise HTTPException(
                        status_code=409,
                        detail="This market has too little liquidity to sell right now.",
                    )

            token, amm_price = await markets_repo.get_token_and_price(db, market_id, outcome)
            if amm_price <= 0:
                raise HTTPException(status_code=400, detail="Invalid market price")

            # Fully-collateralized exit price: the seller's proportional claim on
            # the escrow pool (weighted by the AMM win-probability), NOT the raw
            # AMM price. This guarantees a pre-resolution sell can never pay out
            # more than the market already holds — the platform is never the
            # counterparty. See docs/.../V6 escrow design + collateral invariant.
            escrow_pool, outcome_total_shares = await markets_repo.get_escrow_and_outcome_shares(
                db, market_id, outcome
            )
            price = compute_pool_sell_price(
                escrow_pool=escrow_pool,
                outcome_price=amm_price,
                outcome_total_shares=outcome_total_shares,
            )
            if price <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="This position cannot be sold right now (no pool value to back it).",
                )

            if payload.expected_price is not None:
                expected = Decimal(str(payload.expected_price))
                drift = abs(price - expected)
                if expected > 0 and (drift / expected) > SELL_PRICE_TOLERANCE:
                    raise HTTPException(
                        status_code=409,
                        detail="Price moved. Refresh and try again.",
                    )

            breakdown = compute_sell_breakdown(float(price), float(sell_shares))

            # V7: reject dust payouts that would cost more in on-chain fees than
            # they return.
            if float(breakdown.net_payout) < Config.SELL_MIN_NET_PAYOUT:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sale proceeds are below the {Config.SELL_MIN_NET_PAYOUT}π minimum.",
                )

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
            order_id = int(order.id)

            # Atomic idempotency: a concurrent duplicate key inserts no row here.
            reserved = await sell_repo.create_reserved(
                db,
                sell_request_id=payload.sell_request_id,
                order_id=order_id,
                position_id=position_id,
                user_id=user_id,
                market_id=market_id,
                outcome=outcome,
                sell_shares=breakdown.shares,
                price=breakdown.price,
                net_payout=breakdown.net_payout,
                status="PAYING",
            )
            if reserved is None:
                raise HTTPException(
                    status_code=409, detail="This sell is already being processed."
                )

            # Reduce the position NOW, before sending Pi. This is what closes the
            # double-spend window: the shares are consumed atomically here, so a
            # second concurrent sell sees fewer/zero shares.
            trade = await insert_market_trade(
                db, user_id, market_id, outcome, breakdown.shares, datetime.now(timezone.utc), side="SELL"
            )
            reduce_result = await reduce_market_position(
                db,
                market_id=market_id,
                user_id=user_id,
                outcome=outcome,
                sell_shares=breakdown.shares,
                updated_at=datetime.now(timezone.utc),
            )
            await update_market_price(db, trade)
            # The refund leaves the market's escrow pool. Guarded so a sell can
            # never pay out more than the pool holds.
            await deduct_from_escrow_pool(db, market_id, breakdown.net_payout)
            await payments_repo.set_order_status(db, order_id=order_id, status="EXECUTED")
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
        # The position was already reduced. Restore it so the user loses nothing.
        try:
            async with db.begin():
                await restore_market_position(
                    db,
                    position_id=position_id,
                    add_shares=breakdown.shares,
                    avg_price=position_avg_price,
                    updated_at=datetime.now(timezone.utc),
                )
                # Payout never left, so put the refund back into the escrow pool.
                await credit_escrow_pool_reversal(db, market_id, breakdown.net_payout)
                await payments_repo.set_order_status(db, order_id=order_id, status="FAILED")
                await sell_repo.mark_failed(
                    db, sell_request_id=payload.sell_request_id, reason=str(exc)
                )
        except Exception:  # pragma: no cover - best-effort recovery
            logger.error(
                "[SELL] payout failed AND restore failed. position=%s order=%s — "
                "position may be short by %s shares; reconcile manually.",
                position_id, order_id, breakdown.shares,
            )
        raise HTTPException(status_code=502, detail=f"Payout failed: {exc}") from exc

    # ----- Tx C: finalize (payout confirmed) -----
    try:
        async with db.begin():
            await sell_repo.mark_settled(db, sell_request_id=payload.sell_request_id, txid=txid)
    except Exception as exc:
        # Payout succeeded and the position is already correctly reduced; only the
        # SETTLED bookkeeping failed. Leave the row PAYING with the txid logged so
        # a reconciliation pass can flip it. Do NOT restore — the sale is real.
        logger.error(
            "[SELL] settled on-chain but final mark failed. position=%s txid=%s err=%s",
            position_id, txid, exc,
        )

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


@router.get("/{position_id}/sell-quote", summary="Preview the pool-collateralized sell payout")
async def sell_quote(
    db: DbSession,
    position_id: int = Path(..., ge=1),
    shares: float = Query(..., gt=0),
    user=Depends(verify_token_strict),
):
    """Return the exact price/breakdown a sell of `shares` would use, so the UI
    shows what the server will actually pay. Same pool-based pricing as the sell
    route — never the raw AMM price."""
    user_id = _user_id(user)

    position = await positions_repo.lock_position(db, position_id=position_id, user_id=user_id)
    await db.rollback()
    if position is None:
        raise HTTPException(status_code=404, detail="Position not found")
    if position.is_closed or Decimal(str(position.shares)) <= 0:
        raise HTTPException(status_code=400, detail="Position is already closed")

    sell_shares = Decimal(str(shares))
    if sell_shares > Decimal(str(position.shares)):
        sell_shares = Decimal(str(position.shares))

    market_id = int(position.market_id)
    outcome = str(position.outcome).upper()
    _token, amm_price = await markets_repo.get_token_and_price(db, market_id, outcome)
    escrow_pool, outcome_total_shares = await markets_repo.get_escrow_and_outcome_shares(
        db, market_id, outcome
    )
    price = compute_pool_sell_price(
        escrow_pool=escrow_pool,
        outcome_price=amm_price,
        outcome_total_shares=outcome_total_shares,
    )
    if price <= 0:
        return {
            "ok": True,
            "sellable": False,
            "price": 0.0,
            "gross": 0.0,
            "fee": 0.0,
            "net_payout": 0.0,
            "reason": "No pool value currently backs this position.",
        }
    breakdown = compute_sell_breakdown(float(price), float(sell_shares))
    return {
        "ok": True,
        "sellable": float(breakdown.net_payout) >= Config.SELL_MIN_NET_PAYOUT,
        "price": float(breakdown.price),
        "shares": float(breakdown.shares),
        "gross": float(breakdown.gross),
        "fee": float(breakdown.fee),
        "net_payout": float(breakdown.net_payout),
    }

"""Pi payment lifecycle, bound to the order each payment settles.

The browser hands us a `paymentId` and later a `txid`. Neither is trusted: every
handler re-fetches the authoritative PaymentDTO from Pi and matches it against the
order before touching the ledger. The position is created here, inside the same
transaction that marks the payment COMPLETED — never by a client-callable route.

See docs/feedbacks/20260621_Payment_Trade_Binding_Design.ko.md.
"""

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core import pi_client
from app.core.config import Config
from app.core.logger import get_logger
from app.core.market import (
    add_to_escrow_pool,
    insert_market_trade,
    update_market_position,
    update_market_price,
)
from app.core.pi_client import PaymentVerificationError, PiPaymentError
from app.core.security import _verify_with_pi, verify_token
from app.db.deps import DbSession
from app.repositories import payments as payments_repo

logger = get_logger()

router = APIRouter(prefix="/pi", tags=["pi"])

FEE_RATE = Decimal(str(Config.FEE_RATE))


def _user_id(user: dict) -> int:
    raw = user.get("sub")
    try:
        return int(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Unauthorized: invalid user id in token")


def _expected_total(order) -> Decimal:
    """What the user actually pays Pi: the order notional plus the platform fee.

    `orders.pi_amount` is price*size and excludes the fee, so it must not be
    compared against the Pi payment amount directly.
    """
    notional = Decimal(str(order.pi_amount))
    fee = (notional * FEE_RATE).quantize(Decimal("0.0001"))
    return (notional + fee).quantize(Decimal("0.0001"))


async def _require_field(request: Request, *names: str) -> dict:
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    for name in names:
        if not data.get(name):
            raise HTTPException(status_code=400, detail=f"{name} is required")
    return data


@router.post("/payments/approve")
async def approve_pi_payments(request: Request, db: DbSession, user=Depends(verify_token)):
    """Verify the Pi payment against its order, record it, then approve with Pi."""
    data = await _require_field(request, "paymentId", "order_id")
    payment_id = str(data["paymentId"])
    try:
        order_id = int(data["order_id"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="order_id must be an integer")

    user_id = _user_id(user)

    try:
        dto = await pi_client.get_payment(payment_id)
    except PiPaymentError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        async with db.begin():
            order = await payments_repo.get_order_for_update(
                db, order_id=order_id, user_id=user_id
            )
            if order is None:
                raise HTTPException(status_code=404, detail="Order not found")
            if order.status != "PENDING":
                raise HTTPException(status_code=409, detail="Order is no longer payable")

            pi_uid = await payments_repo.get_user_pi_uid(db, user_id=user_id)
            if not pi_uid:
                raise HTTPException(status_code=403, detail="User has no linked Pi account")

            try:
                pi_client.verify_payment_matches_order(
                    dto,
                    expected_total=_expected_total(order),
                    expected_order_id=order_id,
                    expected_pi_uid=pi_uid,
                )
            except PaymentVerificationError as exc:
                logger.warning(
                    "[PI APPROVE] rejected payment %s for order %s: %s",
                    payment_id, order_id, exc,
                )
                raise HTTPException(status_code=400, detail=str(exc)) from exc

            row = await payments_repo.create_approved(
                db,
                order_id=order_id,
                user_id=user_id,
                amount=Decimal(str(dto.get("amount"))),
                pi_payment_id=payment_id,
                raw_payload=dto,
            )
            if row is None:
                raise HTTPException(status_code=409, detail="Payment already recorded")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[PI APPROVE] failed for payment %s: %s", payment_id, exc)
        raise HTTPException(status_code=500, detail="Failed to approve payment") from exc

    try:
        pi_response = await pi_client.approve_payment(payment_id)
    except PiPaymentError as exc:
        # The row stays APPROVED-but-unconfirmed; Pi never saw our approval, so the
        # user cannot complete it. The order remains PENDING and is retryable.
        logger.error("[PI APPROVE] Pi rejected approval of %s: %s", payment_id, exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"status": "approved", "pi_response": pi_response}


@router.post("/payments/complete")
async def complete_pi_payments(request: Request, db: DbSession, user=Depends(verify_token)):
    """Complete with Pi, confirm the on-chain tx, then record the position atomically."""
    data = await _require_field(request, "paymentId", "txid")
    payment_id = str(data["paymentId"])
    txid = str(data["txid"])
    user_id = _user_id(user)

    # Read before opening the write transaction; SQLAlchemy autobegins on first
    # use, so this must be committed before `db.begin()` below.
    payment = await payments_repo.get_by_pi_payment_id(db, pi_payment_id=payment_id)
    await db.rollback()

    if payment is None:
        raise HTTPException(status_code=404, detail="Unknown payment")
    if payment["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Payment belongs to another user")
    if payment["status"] == "COMPLETED":
        return {"status": "completed", "already": True}
    if payment["status"] != "APPROVED":
        raise HTTPException(status_code=409, detail="Payment is not awaiting completion")

    try:
        pi_response = await pi_client.complete_payment(payment_id, txid)
    except PiPaymentError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # Re-fetch rather than trust the completion response, then require Pi to have
    # verified the transaction on-chain before we hand out any shares.
    try:
        dto = await pi_client.get_payment(payment_id)
        pi_client.assert_transaction_verified(dto, expected_txid=txid)
    except PiPaymentError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except PaymentVerificationError as exc:
        logger.warning("[PI COMPLETE] unverified tx for %s: %s", payment_id, exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    order_id = payment["order_id"]
    try:
        async with db.begin():
            order = await payments_repo.get_order_for_update(
                db, order_id=order_id, user_id=user_id
            )
            if order is None:
                raise HTTPException(status_code=404, detail="Order not found")
            if order.status != "PENDING":
                raise HTTPException(status_code=409, detail="Order already settled")

            completed = await payments_repo.mark_completed(
                db, pi_payment_id=payment_id, txid=txid, raw_payload=dto
            )
            if completed is None:
                raise HTTPException(status_code=409, detail="Payment already completed")

            trade = await insert_market_trade(
                db,
                user_id,
                int(order.market_id),
                str(order.outcome),
                Decimal(str(order.size)),
                datetime.now(timezone.utc),
            )
            await update_market_position(db, trade)
            await update_market_price(db, trade)
            # Escrow the staked principal (fee-excluded) so it can later fund the
            # winners of this market. order.pi_amount = price*size (no fee).
            await add_to_escrow_pool(db, int(order.market_id), Decimal(str(order.pi_amount)))
            await payments_repo.set_order_status(db, order_id=order_id, status="EXECUTED")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[PI COMPLETE] settlement failed for %s: %s", payment_id, exc)
        raise HTTPException(status_code=500, detail="Failed to settle payment") from exc

    logger.info("[PI COMPLETE] settled payment %s for order %s", payment_id, order_id)
    return {"status": "completed", "pi_response": pi_response}


@router.post("/payments/incomplete")
async def incomplete_pi_payments(request: Request, db: DbSession):
    """Report on a payment the SDK reports as dangling.

    This fires from inside `Pi.authenticate()`, before `/auth/pi/verify` has minted
    our JWT, so it cannot use `verify_token`. We authenticate with the Pi access
    token the SDK already holds and require the payment to belong to that Pi user.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    payment = (body or {}).get("payment")
    if not isinstance(payment, dict):
        raise HTTPException(status_code=400, detail="Payment data missing")

    payment_id = payment.get("identifier")
    if not payment_id:
        raise HTTPException(status_code=400, detail="Invalid payment data")

    auth_header = request.headers.get("authorization") or ""
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Pi access token required")
    me = await _verify_with_pi(auth_header.split(" ", 1)[1].strip())
    if not me:
        raise HTTPException(status_code=401, detail="Invalid Pi access token")
    caller_uid = str((me.get("uid") or ""))

    # Trust Pi, not the request body, for who this payment belongs to.
    try:
        dto = await pi_client.get_payment(str(payment_id))
    except PiPaymentError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if str(dto.get("user_uid") or "") != caller_uid:
        raise HTTPException(status_code=403, detail="Payment belongs to another user")

    known = await payments_repo.get_by_pi_payment_id(db, pi_payment_id=str(payment_id))
    logger.info("[PI INCOMPLETE] dangling payment %s for pi_uid %s", payment_id, caller_uid)
    return {
        "status": "handled",
        "payment_status": known["status"] if known else "UNKNOWN",
    }


@router.post("/payments/cancel")
async def cancel_pi_payments(request: Request, db: DbSession, user=Depends(verify_token)):
    """Cancel with Pi, not just locally, then release the order."""
    data = await _require_field(request, "paymentId")
    payment_id = str(data["paymentId"])
    user_id = _user_id(user)

    known = await payments_repo.get_by_pi_payment_id(db, pi_payment_id=payment_id)
    await db.rollback()  # release the autobegun read transaction before writing

    if known is not None and known["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Payment belongs to another user")

    try:
        pi_response = await pi_client.cancel_payment(payment_id)
    except PiPaymentError as exc:
        logger.error("[PI CANCEL] Pi rejected cancel of %s: %s", payment_id, exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if known is not None:
        async with db.begin():
            await payments_repo.mark_cancelled(db, pi_payment_id=payment_id)
            await payments_repo.set_order_status(
                db, order_id=known["order_id"], status="CANCELLED"
            )

    logger.info("[PI CANCEL] cancelled payment %s for user %s", payment_id, user_id)
    return {"status": "cancelled", "pi_response": pi_response}

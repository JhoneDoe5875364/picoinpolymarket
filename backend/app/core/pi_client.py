"""Server-side Pi Platform client and payment verification.

The browser hands us a `paymentId` and a `txid`. Neither can be trusted: the
server re-fetches the payment from Pi and matches it against the order it claims
to pay for. See docs/feedbacks/20260621_Payment_Trade_Binding_Design.ko.md.
"""

from __future__ import annotations

import os
from decimal import Decimal
from typing import Any, Optional

import httpx

from app.core.config import Config
from app.core.logger import get_logger

logger = get_logger()

_TIMEOUT = 10.0
AMOUNT_TOLERANCE = Decimal(Config.PAYMENT_AMOUNT_TOLERANCE)


class PiPaymentError(Exception):
    """Pi API was unreachable or returned something unusable."""


class PaymentVerificationError(Exception):
    """The payment exists but does not match the order it claims to pay for."""


def _headers() -> dict[str, str]:
    key = os.getenv("PI_API_KEY", "")
    if not key:
        raise PiPaymentError("PI_API_KEY is not configured")
    return {"Authorization": f"Key {key}", "Content-Type": "application/json"}


async def _request(method: str, path: str, json: Optional[dict] = None) -> dict[str, Any]:
    url = f"{Config.PI_API_BASE}{path}"
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.request(method, url, headers=_headers(), json=json)
    except httpx.RequestError as exc:
        logger.error("Pi API %s %s unreachable: %s", method, path, exc)
        raise PiPaymentError("Failed to reach the Pi server") from exc

    if response.status_code != 200:
        logger.error("Pi API %s %s -> %s: %s", method, path, response.status_code, response.text)
        raise PiPaymentError(f"Pi API returned {response.status_code}")

    try:
        payload = response.json()
    except Exception as exc:
        raise PiPaymentError("Invalid response from the Pi server") from exc

    if not isinstance(payload, dict):
        raise PiPaymentError("Invalid response from the Pi server")
    return payload


async def get_payment(payment_id: str) -> dict[str, Any]:
    """Fetch the authoritative PaymentDTO straight from Pi."""
    return await _request("GET", f"/v2/payments/{payment_id}")


async def approve_payment(payment_id: str) -> dict[str, Any]:
    return await _request("POST", f"/v2/payments/{payment_id}/approve")


async def complete_payment(payment_id: str, txid: str) -> dict[str, Any]:
    return await _request("POST", f"/v2/payments/{payment_id}/complete", json={"txid": txid})


async def cancel_payment(payment_id: str) -> dict[str, Any]:
    return await _request("POST", f"/v2/payments/{payment_id}/cancel")


def _to_decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value))
    except Exception as exc:
        raise PaymentVerificationError(f"Unreadable amount: {value!r}") from exc


def verify_payment_matches_order(
    dto: dict[str, Any],
    *,
    expected_total: Decimal,
    expected_order_id: int,
    expected_pi_uid: str,
) -> None:
    """Raise PaymentVerificationError unless this Pi payment pays for this order.

    Checks amount, recipient wallet, the order id embedded in metadata, and payer.
    """
    amount = _to_decimal(dto.get("amount"))
    if abs(amount - expected_total) > AMOUNT_TOLERANCE:
        raise PaymentVerificationError(
            f"amount mismatch: Pi reports {amount}, order totals {expected_total}"
        )

    expected_wallet = Config.PI_APP_WALLET_ADDRESS
    if expected_wallet:
        if str(dto.get("to_address") or "") != expected_wallet:
            raise PaymentVerificationError("payment was not sent to the app wallet")
    else:
        logger.warning(
            "PI_APP_WALLET_ADDRESS is unset; skipping recipient check for payment %s",
            dto.get("identifier"),
        )

    metadata = dto.get("metadata")
    if not isinstance(metadata, dict):
        raise PaymentVerificationError("payment carries no metadata")
    try:
        metadata_order_id = int(metadata.get("order_id"))
    except (TypeError, ValueError) as exc:
        raise PaymentVerificationError("payment metadata has no usable order_id") from exc
    if metadata_order_id != expected_order_id:
        raise PaymentVerificationError(
            f"payment is bound to order {metadata_order_id}, not {expected_order_id}"
        )

    if str(dto.get("user_uid") or "") != str(expected_pi_uid):
        raise PaymentVerificationError("payment was made by a different user")


def assert_transaction_verified(dto: dict[str, Any], *, expected_txid: str) -> None:
    """Raise unless Pi confirms the on-chain transaction for this payment."""
    status = dto.get("status")
    if not isinstance(status, dict):
        raise PaymentVerificationError("payment carries no status")
    if not status.get("transaction_verified"):
        raise PaymentVerificationError("Pi has not verified the transaction")

    transaction = dto.get("transaction")
    if not isinstance(transaction, dict):
        raise PaymentVerificationError("payment carries no transaction")
    if str(transaction.get("txid") or "") != str(expected_txid):
        raise PaymentVerificationError("txid does not match the payment's transaction")

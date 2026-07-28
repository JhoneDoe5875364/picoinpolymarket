"""App-to-User (A2U) payouts via the vendored Pi library.

The vendored pi_python swallows errors and returns "" / False on failure, so
this wrapper checks every step and raises a clear error instead. It also runs
the blocking, network-heavy SDK calls in a thread so they don't stall the async
event loop.

Sending needs the app wallet's SECRET SEED (Config.PI_APP_WALLET_SECRET_SEED).
Payouts are addressed by the recipient's Pi uid, not a wallet address.
"""

from __future__ import annotations

import asyncio
import os
from typing import Any, Optional

from app.core.config import Config
from app.core.logger import get_logger

logger = get_logger()


class A2UError(Exception):
    """A payout could not be sent. The message is safe to log (no secrets)."""


class A2UDisabled(A2UError):
    """Auto-pay is not configured (no secret seed)."""


def _build_client():
    if not Config.a2u_enabled():
        raise A2UDisabled("A2U auto-pay is disabled (PI_APP_WALLET_SECRET_SEED unset)")
    api_key = os.getenv("PI_API_KEY", "").strip()
    if not api_key:
        raise A2UError("PI_API_KEY is not configured")

    # Import lazily so the app still boots if stellar-sdk isn't installed.
    try:
        from app.core.vendor.pi_python import PiNetwork
    except Exception as exc:  # pragma: no cover - import/env issue
        raise A2UError(f"Pi A2U library unavailable: {exc}") from exc

    pi = PiNetwork()
    # initialize() returns False on failure (bad seed, network unreachable, ...).
    result = pi.initialize(
        api_key, Config.PI_APP_WALLET_SECRET_SEED, Config.PI_NETWORK
    )
    if result is False:
        raise A2UError("Failed to initialize Pi A2U client (check seed/network)")
    return pi


def _send_sync(*, amount: float, uid: str, memo: str, metadata: dict[str, Any]) -> str:
    """Blocking create -> submit -> complete. Returns the on-chain txid."""
    pi = _build_client()

    payment_data = {
        "amount": amount,
        "memo": memo,
        "metadata": metadata,
        "uid": uid,
    }

    payment_id = pi.create_payment(payment_data)
    if not payment_id:
        # create_payment returns "" on insufficient balance or API error.
        raise A2UError(
            "create_payment failed (insufficient app-wallet balance or Pi API error)"
        )

    txid = pi.submit_payment(payment_id, False)
    if not txid:
        # Leave the payment for /incomplete recovery; do not silently drop it.
        raise A2UError(f"submit_payment failed for payment {payment_id}")

    # complete_payment has no meaningful return; failure raises inside requests.
    pi.complete_payment(payment_id, txid)

    logger.info("[A2U] paid uid=%s amount=%s txid=%s", uid, amount, txid)
    return txid


async def send_payout(
    *, amount: float, uid: str, memo: str, metadata: Optional[dict[str, Any]] = None
) -> str:
    """Send `amount` Pi to the user `uid`. Returns the txid or raises A2UError."""
    if amount <= 0:
        raise A2UError("Payout amount must be positive")
    if not uid:
        raise A2UError("Recipient uid is required")
    return await asyncio.to_thread(
        _send_sync,
        amount=float(amount),
        uid=str(uid),
        memo=memo,
        metadata=metadata or {},
    )

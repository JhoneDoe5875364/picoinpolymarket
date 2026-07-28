"""One-off: complete or cancel a dangling Pi payment blocking new payments.

A payment stuck at developer_completed=False stops the user from making any new
payment (including A2U payouts). This fetches it, and — if the on-chain tx is
verified — completes it; otherwise cancels it.

Usage (on the server, venv active):
    python bin/fix_incomplete_payment.py <payment_id>
    python bin/fix_incomplete_payment.py <payment_id> --cancel   # force cancel
"""

import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

BASE = "https://api.minepi.com"


def headers():
    key = os.getenv("PI_API_KEY", "").strip()
    if not key:
        sys.exit("PI_API_KEY is not set")
    return {"Authorization": f"Key {key}", "Content-Type": "application/json"}


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: fix_incomplete_payment.py <payment_id> [--cancel]")
    payment_id = sys.argv[1]
    force_cancel = "--cancel" in sys.argv[2:]

    r = requests.get(f"{BASE}/v2/payments/{payment_id}", headers=headers())
    print("GET payment:", r.status_code)
    dto = r.json()
    print("  direction:", dto.get("direction"))
    status = dto.get("status", {})
    print("  transaction_verified:", status.get("transaction_verified"))
    print("  developer_completed:", status.get("developer_completed"))
    txid = (dto.get("transaction") or {}).get("txid")
    print("  txid:", txid)

    if status.get("developer_completed"):
        print("Already completed. Nothing to do.")
        return

    if force_cancel or not status.get("transaction_verified"):
        r = requests.post(
            f"{BASE}/v2/payments/{payment_id}/cancel", json={}, headers=headers()
        )
        print("CANCEL:", r.status_code, r.text[:200])
    else:
        # tx is verified on-chain: settle it as completed.
        r = requests.post(
            f"{BASE}/v2/payments/{payment_id}/complete",
            json={"txid": txid},
            headers=headers(),
        )
        print("COMPLETE:", r.status_code, r.text[:200])


if __name__ == "__main__":
    main()

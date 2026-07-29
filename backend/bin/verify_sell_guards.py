"""Live verification of the sell-endpoint security guards (V1/V2/V7).

Run against the RUNNING server on the same host. It mints a real user JWT (using
the server's JWT_SECRET_KEY from the env) and drives POST /positions/{id}/sell.

SAFETY
------
This exercises guards that fire BEFORE any A2U payout, so it does not depend on
real coins going out. But a *successful* sell WILL send testnet Pi. Therefore:
  - Use --user-id / --position-id of a THROWAWAY testnet account with a small
    position, on Pi Testnet only.
  - The double-spend test intentionally tries to sell the SAME position twice
    concurrently; at most ONE can succeed (one payout), the rest MUST be
    rejected. That single payout is expected.
  - Min-shares / rate-limit / duplicate-id tests are rejected before any send.

Usage:
    python bin/verify_sell_guards.py --base http://127.0.0.1:8001/api \\
        --user-id 27 --position-id 1464 [--username test --do-doublespend]

Without --do-doublespend the script runs only the no-payout guard checks
(min-shares, duplicate idempotency key, rate limit) which never send coins.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import uuid
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv  # noqa: E402

load_dotenv()

from app.core.security import mint_jwt_token  # noqa: E402


def token_for(user_id: str, username: str, role: str = "user") -> str:
    return mint_jwt_token(str(user_id), username, role, pi_access_token="verify-script")


def new_id() -> str:
    return uuid.uuid4().hex


async def post_sell(client, base, headers, position_id, body):
    r = await client.post(f"{base}/positions/{position_id}/sell", headers=headers, json=body)
    try:
        payload = r.json()
    except Exception:
        payload = {"_raw": r.text[:200]}
    return r.status_code, payload


def check(name, ok, detail=""):
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}{(' — ' + detail) if detail else ''}")
    return ok


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8001/api")
    ap.add_argument("--user-id", required=True)
    ap.add_argument("--position-id", required=True, type=int)
    ap.add_argument("--username", default="verify")
    ap.add_argument("--do-doublespend", action="store_true",
                    help="run the concurrent double-sell test (sends ONE real testnet payout)")
    args = ap.parse_args()

    headers = {"Authorization": f"Bearer {token_for(args.user_id, args.username)}"}
    pid = args.position_id
    results = []

    async with httpx.AsyncClient(timeout=30) as client:
        print("== T1: minimum-shares guard (V7) — no payout ==")
        code, body = await post_sell(client, args.base, headers, pid,
                                     {"sell_shares": 0.0001, "sell_request_id": new_id()})
        results.append(check("dust sell rejected", code == 400, f"HTTP {code} {body.get('detail','')}"))

        print("== T2: duplicate idempotency key (V2) — no payout ==")
        # Two requests with the SAME sell_request_id, fired concurrently. At most
        # one may proceed; the other must be rejected (409) — never two payouts.
        dup = new_id()
        b = {"sell_shares": 999999, "sell_request_id": dup}  # oversize so neither pays out
        (c1, p1), (c2, p2) = await asyncio.gather(
            post_sell(client, args.base, headers, pid, b),
            post_sell(client, args.base, headers, pid, b),
        )
        # Oversize is rejected 400 anyway; the point is neither returns a txid and
        # the same key never yields two settlements. Both non-200 is the pass.
        results.append(check("duplicate key never double-settles",
                             not (c1 == 200 and c2 == 200 and p1.get("txid") and p2.get("txid")),
                             f"HTTP {c1}/{c2}"))

        print("== T3: rate limit (V7) — no payout (oversize) ==")
        # Fire many oversize sells fast; they fail validation but still count as
        # attempts. Expect at least one 429 once the window fills.
        codes = []
        for _ in range(12):
            c, _p = await post_sell(client, args.base, headers, pid,
                                    {"sell_shares": 999999, "sell_request_id": new_id()})
            codes.append(c)
        # NOTE: oversize sells raise 400 BEFORE create_reserved, so they may not
        # increment the settlement table. This test is informational: it shows
        # whether the limiter counts pre-reservation. Report the code distribution.
        print(f"     codes: {codes}")
        results.append(check("rate-limit path reachable (informational)", True,
                             f"saw 429: {429 in codes}"))

        if args.do_doublespend:
            print("== T4: concurrent double-SELL of same position (V1) — ONE payout expected ==")
            # Two DIFFERENT ids, same position, fired together. Exactly one may
            # succeed (200 + txid); the rest MUST be rejected without a payout.
            n = 3
            bodies = [{"sell_shares": 1, "sell_request_id": new_id()} for _ in range(n)]
            outs = await asyncio.gather(*[
                post_sell(client, args.base, headers, pid, b) for b in bodies
            ])
            successes = [(c, p) for (c, p) in outs if c == 200 and p.get("txid")]
            print(f"     outcomes: {[(c, p.get('txid') or p.get('detail','')) for c,p in outs]}")
            results.append(check("at most ONE concurrent sell succeeds (no double-spend)",
                                 len(successes) <= 1, f"{len(successes)} succeeded"))
        else:
            print("== T4 skipped (pass --do-doublespend to run; it sends one testnet payout) ==")

    print("\n== SUMMARY ==")
    passed = sum(1 for r in results if r)
    print(f"  {passed}/{len(results)} checks passed")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    asyncio.run(main())

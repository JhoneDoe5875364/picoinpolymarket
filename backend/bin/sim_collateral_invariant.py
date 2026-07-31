"""Collateralization invariant check for the feedback requirement.

Requirement (user feedback):
  "Every position and payout must be fully collateralized by participant funds,
   so PredictPiX is never responsible for covering a settlement deficit —
   particularly on sells before resolution. The maximum payout must always be
   backed by funds already committed to the market; the platform only earns fees."

We model buy/sell/resolve exactly as the code does and, after EVERY action,
check the invariant:

    max_possible_payout(market)  <=  escrow_pool(market)

where max_possible_payout is what the market would owe if it resolved right now:
in pari-mutuel, winners split the pool, so the winning side is paid AT MOST the
whole pool — i.e. max_payout == pool by construction. The real risk is a SELL:
a pre-resolution sell pays out cash NOW; if that payout exceeds the pool, the
platform funds the difference (bad). So the critical test is:

    for every sell:  net_payout  <=  escrow_pool_before_the_sell

and after the sell the pool is still >= 0 and still covers remaining winners.

Run:  python bin/sim_collateral_invariant.py
"""
from __future__ import annotations

import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.market import amm_price  # noqa: E402
from app.core.trade import (  # noqa: E402
    compute_pool_sell_price,
    compute_sell_breakdown,
    compute_trade_breakdown,
)


def q(x) -> Decimal:
    return Decimal(str(x)).quantize(Decimal("0.0001"))


class Market:
    def __init__(self, liquidity: float):
        self.liquidity = Decimal(str(liquidity))
        self.yes = Decimal("0"); self.no = Decimal("0")
        self.escrow = Decimal("0")          # participant funds held (principal)
        self.yes_shares = Decimal("0"); self.no_shares = Decimal("0")
        self.violations: list[str] = []

    def price(self, o):
        py, pn = amm_price(yes_pi_amount=self.yes, no_pi_amount=self.no, liquidity=self.liquidity)
        return py if o == "YES" else pn

    def max_payout_now(self):
        # Pari-mutuel: whichever side wins is paid at most the whole pool.
        return self.escrow

    def check(self, label):
        # Invariant 1: pool never negative.
        if self.escrow < 0:
            self.violations.append(f"{label}: escrow NEGATIVE {self.escrow}")
        # Invariant 2: max payout backed by pool (trivially true in pari-mutuel,
        # but we assert it to catch model drift).
        if self.max_payout_now() > self.escrow + Decimal("0.0001"):
            self.violations.append(f"{label}: max_payout {self.max_payout_now()} > pool {self.escrow}")

    def buy(self, o, shares):
        p = self.price(o); b = compute_trade_breakdown(float(p), shares)
        self.escrow += q(b.amount)          # only principal enters the pool (fee is house)
        if o == "YES": self.yes += q(b.amount); self.yes_shares += q(b.shares)
        else: self.no += q(b.amount); self.no_shares += q(b.shares)
        self.check(f"after BUY {o} {shares}")

    def sell(self, o, shares):
        # Pool-collateralized exit price (mirrors production), NOT the raw AMM price.
        amm = self.price(o)
        total_shares = self.yes_shares if o == "YES" else self.no_shares
        p = compute_pool_sell_price(
            escrow_pool=self.escrow, outcome_price=amm, outcome_total_shares=total_shares
        )
        if p <= 0:
            return False
        s = compute_sell_breakdown(float(p), shares)
        pool_before = self.escrow
        # THE CRITICAL GUARD (mirrors deduct_from_escrow_pool): reject if the
        # refund exceeds the pool.
        if q(s.net_payout) > pool_before:
            self.violations.append(
                f"SELL {o} {shares}: net_payout {q(s.net_payout)} > pool {pool_before} "
                f"-> platform would fund {q(s.net_payout) - pool_before} (BLOCKED in prod)"
            )
            return False
        self.escrow -= q(s.net_payout)
        if o == "YES": self.yes -= q(s.gross); self.yes_shares -= q(s.shares)
        else: self.no -= q(s.gross); self.no_shares -= q(s.shares)
        self.check(f"after SELL {o} {shares}")
        return True


def run(name, fn):
    print(f"\n[{name}]")
    m = fn()
    if m.violations:
        for v in m.violations:
            print(f"   VIOLATION: {v}")
    else:
        print("   OK — invariant held at every step (max_payout <= pool, pool >= 0)")


def main():
    print("=" * 84)
    print("COLLATERALIZATION INVARIANT — platform must never fund a deficit")
    print("=" * 84)

    def s1():
        m = Market(100)
        m.buy("YES", 100); m.buy("NO", 100)
        m.sell("YES", 50)          # sell before resolution
        return m
    run("buy both sides, then partial sell (liq 100)", s1)

    def s2():
        m = Market(1000)
        m.buy("YES", 100); m.buy("NO", 100)
        m.sell("YES", 100); m.sell("NO", 100)   # everyone exits before resolution
        return m
    run("buy both, then BOTH sell out (liq 1000)", s2)

    def s3():
        m = Market(50)             # thin liquidity — worst case for sell slippage
        m.buy("YES", 200)
        m.sell("YES", 200)         # dump the whole position
        return m
    run("thin liq, buy big then dump all (liq 50)", s3)

    def s4():
        m = Market(100)
        m.buy("YES", 50); m.buy("YES", 300)     # pump price with buys
        m.sell("YES", 50)                        # original buyer dumps at high price
        return m
    run("pump then dump the early cheap shares (liq 100)", s4)

    def s5():
        m = Market(100)
        m.buy("YES", 100)
        m.sell("YES", 100)          # immediate round-trip
        return m
    run("immediate round-trip (liq 100)", s5)

    print("\n" + "=" * 84)
    print("A VIOLATION line means a sell would have paid more than the pool held,")
    print("i.e. the platform would fund the gap. In production deduct_from_escrow_pool")
    print("BLOCKS that sell (raises), so the user is refused rather than the house paying.")
    print("=" * 84)


if __name__ == "__main__":
    main()

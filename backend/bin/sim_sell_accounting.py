"""V6 accounting simulation — does selling drain the app wallet?

Uses the REAL pricing/breakdown functions from app.core so the numbers match
production, not a hand-rolled model.

App-wallet cash flow per action (from the code):
  BUY  (U2A): app RECEIVES  price*shares + fee            (income)
  SELL (A2U): app PAYS       sell_price*shares - fee       (expense)
  WIN  settle: app PAYS       shares * 1.0                  (expense, final_price=1)

AMM (amm_price): price_yes = (yes + L/2) / (yes + no + L), where yes/no are the
cumulative pi_amount (price*shares) traded on each side and L is liquidity.
A BUY adds price*shares to its side's pool (pushing that price up); a SELL
subtracts it (pushing it back down). We replay these exact mechanics.

Run:  python bin/sim_sell_accounting.py
"""

from __future__ import annotations

import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.market import amm_price  # noqa: E402
from app.core.trade import compute_sell_breakdown, compute_trade_breakdown  # noqa: E402

FEE = Decimal("0.02")


class Market:
    """Replays AMM pool state the way core.market does."""

    def __init__(self, liquidity: float):
        self.liquidity = Decimal(str(liquidity))
        self.yes = Decimal("0")  # cumulative pi_amount on YES
        self.no = Decimal("0")

    def price(self, outcome: str) -> Decimal:
        py, pn = amm_price(yes_pi_amount=self.yes, no_pi_amount=self.no, liquidity=self.liquidity)
        return py if outcome == "YES" else pn

    def apply_buy(self, outcome: str, pi_amount: Decimal):
        if outcome == "YES":
            self.yes += pi_amount
        else:
            self.no += pi_amount

    def apply_sell(self, outcome: str, pi_amount: Decimal):
        if outcome == "YES":
            self.yes -= pi_amount
        else:
            self.no -= pi_amount


def q(x) -> Decimal:
    return Decimal(str(x)).quantize(Decimal("0.0001"))


def scenario_wash_roundtrip(liquidity: float, shares: float, outcome: str = "YES"):
    """Attacker buys N shares, then immediately sells them. Net app-wallet flow?"""
    m = Market(liquidity)
    app_wallet = Decimal("0")  # +income / -expense

    p_buy = m.price(outcome)
    buy = compute_trade_breakdown(float(p_buy), shares)
    # App RECEIVES total_cost (amount + fee).
    app_wallet += q(buy.total_cost)
    m.apply_buy(outcome, q(buy.amount))  # pool grows by price*shares

    p_sell = m.price(outcome)
    sell = compute_sell_breakdown(float(p_sell), shares)
    # App PAYS net_payout (gross - fee).
    app_wallet -= q(sell.net_payout)
    m.apply_sell(outcome, q(sell.gross))

    return {
        "liquidity": liquidity,
        "shares": shares,
        "buy_price": float(p_buy),
        "sell_price": float(p_sell),
        "app_received": float(q(buy.total_cost)),
        "app_paid": float(q(sell.net_payout)),
        "app_net": float(q(app_wallet)),  # >0 app profit, <0 app loss
    }


def scenario_buy_then_win(liquidity: float, shares: float, outcome: str = "YES"):
    """Buy, then the market resolves in the buyer's favour (worst case for app)."""
    m = Market(liquidity)
    app_wallet = Decimal("0")

    p_buy = m.price(outcome)
    buy = compute_trade_breakdown(float(p_buy), shares)
    app_wallet += q(buy.total_cost)
    m.apply_buy(outcome, q(buy.amount))

    # Winning payout = shares * final_price(=1).
    payout = q(Decimal(str(shares)) * Decimal("1"))
    app_wallet -= payout

    return {
        "liquidity": liquidity,
        "shares": shares,
        "buy_price": float(p_buy),
        "app_received": float(q(buy.total_cost)),
        "win_payout": float(payout),
        "app_net": float(q(app_wallet)),
    }


def scenario_sequential_pump(liquidity: float, buys: list[float], outcome: str = "YES"):
    """One attacker makes several buys to pump price, then dumps everything.

    Models the realistic wash attack: repeated buys push the AMM price up, then a
    single large sell exits at the inflated price.
    """
    m = Market(liquidity)
    app_wallet = Decimal("0")
    total_shares = Decimal("0")

    for s in buys:
        p = m.price(outcome)
        b = compute_trade_breakdown(float(p), s)
        app_wallet += q(b.total_cost)
        m.apply_buy(outcome, q(b.amount))
        total_shares += q(b.shares)

    p_sell = m.price(outcome)
    sell = compute_sell_breakdown(float(p_sell), float(total_shares))
    app_wallet -= q(sell.net_payout)
    m.apply_sell(outcome, q(sell.gross))

    return {
        "liquidity": liquidity,
        "buys": buys,
        "total_shares": float(total_shares),
        "final_sell_price": float(p_sell),
        "app_net": float(q(app_wallet)),
    }


def main():
    print("=" * 74)
    print("V6 ACCOUNTING SIMULATION — app-wallet net flow (>0 profit, <0 LOSS)")
    print("=" * 74)

    print("\n[A] Instant wash round-trip (buy N, immediately sell N):")
    print(f"{'liq':>8} {'shares':>8} {'buyP':>7} {'sellP':>7} {'recv':>9} {'paid':>9} {'NET':>10}")
    for liq in (50, 200, 1000, 5000):
        for sh in (10, 100, 500):
            r = scenario_wash_roundtrip(liq, sh)
            flag = "  <-- LOSS" if r["app_net"] < 0 else ""
            print(f"{r['liquidity']:>8} {r['shares']:>8} {r['buy_price']:>7.4f} "
                  f"{r['sell_price']:>7.4f} {r['app_received']:>9.4f} "
                  f"{r['app_paid']:>9.4f} {r['app_net']:>10.4f}{flag}")

    print("\n[B] Sequential pump then dump (repeated buys, then sell all):")
    print(f"{'liq':>8} {'total_sh':>9} {'sellP':>7} {'NET':>10}")
    for liq in (50, 200, 1000):
        r = scenario_sequential_pump(liq, [100, 100, 100, 100, 100])
        flag = "  <-- LOSS" if r["app_net"] < 0 else ""
        print(f"{r['liquidity']:>8} {r['total_shares']:>9} {r['final_sell_price']:>7.4f} "
              f"{r['app_net']:>10.4f}{flag}")

    print("\n[C] Buy then WIN (market resolves for the buyer; final_price=1):")
    print(f"{'liq':>8} {'shares':>8} {'buyP':>7} {'recv':>9} {'payout':>9} {'NET':>10}")
    for liq in (50, 200, 1000, 5000):
        for sh in (10, 100):
            r = scenario_buy_then_win(liq, sh)
            flag = "  <-- LOSS" if r["app_net"] < 0 else ""
            print(f"{r['liquidity']:>8} {r['shares']:>8} {r['buy_price']:>7.4f} "
                  f"{r['app_received']:>9.4f} {r['win_payout']:>9.4f} "
                  f"{r['app_net']:>10.4f}{flag}")

    print("\n" + "=" * 74)
    print("Legend: buyP/sellP = AMM price at buy/sell. NET<0 means the app wallet")
    print("loses Pi on that action sequence (the V6 concern).")
    print("=" * 74)


if __name__ == "__main__":
    main()

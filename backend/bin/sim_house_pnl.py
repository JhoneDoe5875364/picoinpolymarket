"""House (app-wallet) P&L analysis across buy / sell / resolution.

Uses the REAL pricing and breakdown functions so the numbers match production.
Goal: expose the *logical* ways the house can gain or lose, i.e. the structural
irrationalities — not a specific attack.

Cash flow per action (from the code):
  BUY  (U2A): house RECEIVES  amount + fee   (amount = price*shares)     [income]
  SELL (A2U): house PAYS      amount - fee   (amount = sellprice*shares) [expense]
  WIN  settle: house PAYS      shares * 1.0                              [expense]
  LOSE settle: house PAYS      0  (loser stake stays in the wallet)      [income kept]

AMM: price_yes = (yes + L/2) / (yes+no+L); a BUY adds price*shares to its pool,
a SELL removes it.

Run:  python bin/sim_house_pnl.py
"""
from __future__ import annotations

import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.market import amm_price  # noqa: E402
from app.core.trade import compute_pool_sell_price, compute_sell_breakdown, compute_trade_breakdown  # noqa: E402

FEE = Decimal("0.02")


def q(x) -> Decimal:
    return Decimal(str(x)).quantize(Decimal("0.0001"))


class Book:
    """Tracks the AMM pools AND the house wallet + per-market escrow intuition."""

    def __init__(self, liquidity: float):
        self.liquidity = Decimal(str(liquidity))
        self.yes = Decimal("0")  # cumulative net pi_amount on YES
        self.no = Decimal("0")
        self.house = Decimal("0")        # net wallet flow (+income / -expense)
        self.fees = Decimal("0")         # fees kept (house profit component)
        self.stake_in = Decimal("0")     # total principal users put in (amount, no fee)
        self.paid_out = Decimal("0")     # total principal-ish paid out (sell + win)
        # track outstanding shares per side (for settlement)
        self.yes_shares = Decimal("0")
        self.no_shares = Decimal("0")

    def price(self, outcome: str) -> Decimal:
        py, pn = amm_price(yes_pi_amount=self.yes, no_pi_amount=self.no, liquidity=self.liquidity)
        return py if outcome == "YES" else pn

    def buy(self, outcome: str, shares: float):
        p = self.price(outcome)
        b = compute_trade_breakdown(float(p), shares)
        self.house += q(b.total_cost)      # receive amount+fee
        self.fees += q(b.fee)
        self.stake_in += q(b.amount)
        if outcome == "YES":
            self.yes += q(b.amount); self.yes_shares += q(b.shares)
        else:
            self.no += q(b.amount); self.no_shares += q(b.shares)
        return p, b

    def sell(self, outcome: str, shares: float):
        # Pool-collateralized exit price (mirrors production).
        amm = self.price(outcome)
        total_shares = self.yes_shares if outcome == "YES" else self.no_shares
        pool_now = q(self.stake_in - self.paid_out)
        p = compute_pool_sell_price(
            escrow_pool=pool_now, outcome_price=amm, outcome_total_shares=total_shares
        )
        if p <= 0:
            return None, None
        s = compute_sell_breakdown(float(p), shares)
        self.house -= q(s.net_payout)      # pay gross-fee
        self.fees += q(s.fee)
        self.paid_out += q(s.net_payout)
        if outcome == "YES":
            self.yes -= q(s.gross); self.yes_shares -= q(s.shares)
        else:
            self.no -= q(s.gross); self.no_shares -= q(s.shares)
        return p, s

    def resolve(self, winner: str):
        """Pari-mutuel: winners split the escrow pool by shares.

        pool = stake_in - sell refunds already paid. Here house tracks net wallet
        flow, so the pool available = stake_in - (principal already refunded via
        sells). We approximate pool as stake_in minus paid_out-so-far (sell nets).
        dividend = pool / winner_shares; each winner gets shares*dividend, so the
        total paid == pool exactly and house keeps only fees.
        """
        pool = q(self.stake_in - self.paid_out)  # principal still escrowed
        win_shares = self.yes_shares if winner == "YES" else self.no_shares
        if win_shares <= 0:
            return Decimal("0")  # no winners: pool retained
        dividend = q(pool / win_shares)
        payout = q(win_shares * dividend)
        self.house -= payout
        self.paid_out += payout
        return payout


def line(label, book: Book):
    print(f"  {label:<34} house={float(book.house):>10.4f}  "
          f"(fees={float(book.fees):>8.4f}  stake_in={float(book.stake_in):>9.4f}  "
          f"paid_out={float(book.paid_out):>9.4f})")


def main():
    print("=" * 92)
    print("HOUSE P&L — how the app wallet gains/loses. house>0 profit, house<0 LOSS")
    print("=" * 92)

    print("\n[1] Two users bet opposite sides, market resolves. Ideal = house keeps only fees.")
    for liq in (100, 1000):
        b = Book(liq)
        b.buy("YES", 100)      # user A backs YES
        b.buy("NO", 100)       # user B backs NO
        pre = float(b.house)
        payout = b.resolve("YES")   # YES wins
        print(f"  liq={liq:<5} after 2 buys house={pre:>9.4f}, YES wins pays {float(payout):.2f}", end="")
        line("-> final", b)
        print(f"           loser NO stake was {float(b.stake_in) - 100:.2f}-ish; "
              f"note fees={float(b.fees):.4f}")

    print("\n[2] One-sided market (everyone bets YES), YES wins. Worst case for house.")
    for liq in (100, 1000):
        b = Book(liq)
        b.buy("YES", 100)
        b.buy("YES", 100)
        b.resolve("YES")
        line(f"liq={liq}", b)

    print("\n[3] Buy then immediately SELL (round-trip). House should net +fees only.")
    for liq in (100, 1000):
        b = Book(liq)
        b.buy("YES", 100)
        b.sell("YES", 100)
        line(f"liq={liq}", b)

    print("\n[4] Buy low, price moves up via more buys, original seller dumps at high price.")
    for liq in (100, 1000):
        b = Book(liq)
        b.buy("YES", 50)       # attacker buys cheap
        b.buy("YES", 300)      # others push price up
        b.sell("YES", 50)      # attacker sells the same 50 at the higher price
        line(f"liq={liq}", b)

    print("\n[5] Balanced book, LOSING side is bigger — house profits from kept loser stake.")
    for liq in (100, 1000):
        b = Book(liq)
        b.buy("YES", 50)       # small YES
        b.buy("NO", 200)       # big NO
        b.resolve("YES")       # YES wins -> NO stake kept
        line(f"liq={liq}", b)

    print("\n" + "=" * 92)
    print("Read: house<0 means the app wallet is out of pocket for that scenario.")
    print("Ideal prediction market: house == +fees always (loser stakes fund winners).")
    print("=" * 92)


if __name__ == "__main__":
    main()

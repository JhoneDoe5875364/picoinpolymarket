"""Canonical trade amount breakdown shared by orders, payments, and positions."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from app.core.config import Config

FEE_RATE = Decimal(str(getattr(Config, "FEE_RATE", 0.02)))
QUANT = Decimal("0.0001")
AMOUNT_TOLERANCE = Decimal("0.0001")


@dataclass(frozen=True)
class TradeBreakdown:
    shares: Decimal
    price: Decimal
    amount: Decimal
    fee: Decimal
    total_cost: Decimal
    estimated_return: Decimal

    def as_dict(self) -> dict[str, float]:
        return {
            "shares": float(self.shares),
            "price": float(self.price),
            "amount": float(self.amount),
            "fee": float(self.fee),
            "total_cost": float(self.total_cost),
            "estimated_return": float(self.estimated_return),
        }


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(QUANT, rounding=ROUND_HALF_UP)


def compute_trade_breakdown(price: float, shares: float) -> TradeBreakdown:
    """Match frontend ``calculateTradeBreakdown`` and ``market.insert_market_trade``."""
    safe_shares = Decimal(str(shares))
    safe_price = Decimal(str(price))
    if safe_shares <= 0:
        raise ValueError("shares must be greater than 0")
    if safe_price <= 0:
        raise ValueError("price must be greater than 0")

    amount = _quantize(safe_price * safe_shares)
    fee = _quantize(amount * FEE_RATE)
    total_cost = _quantize(amount + fee)

    return TradeBreakdown(
        shares=_quantize(safe_shares),
        price=_quantize(safe_price),
        amount=amount,
        fee=fee,
        total_cost=total_cost,
        estimated_return=_quantize(safe_shares),
    )


@dataclass(frozen=True)
class SellBreakdown:
    """Amount breakdown for closing (selling) shares back to the market.

    Mirror of ``TradeBreakdown`` but for the payout direction: the fee is
    *subtracted* from the gross proceeds rather than added on top, so
    ``net_payout`` is what the user actually receives via A2U.
    """

    shares: Decimal
    price: Decimal
    gross: Decimal
    fee: Decimal
    net_payout: Decimal

    def as_dict(self) -> dict[str, float]:
        return {
            "shares": float(self.shares),
            "price": float(self.price),
            "gross": float(self.gross),
            "fee": float(self.fee),
            "net_payout": float(self.net_payout),
        }


def compute_sell_breakdown(price: float, shares: float) -> SellBreakdown:
    """Proceeds of selling ``shares`` at ``price``.

    BUY adds the fee (``total_cost = amount + fee``); SELL subtracts it
    (``net_payout = gross - fee``). Same FEE_RATE and quantization as
    ``compute_trade_breakdown`` so the two directions stay symmetric.
    """
    safe_shares = Decimal(str(shares))
    safe_price = Decimal(str(price))
    if safe_shares <= 0:
        raise ValueError("shares must be greater than 0")
    if safe_price <= 0:
        raise ValueError("price must be greater than 0")

    gross = _quantize(safe_price * safe_shares)
    fee = _quantize(gross * FEE_RATE)
    net_payout = _quantize(gross - fee)
    if net_payout <= 0:
        raise ValueError("net payout must be greater than 0")

    return SellBreakdown(
        shares=_quantize(safe_shares),
        price=_quantize(safe_price),
        gross=gross,
        fee=fee,
        net_payout=net_payout,
    )


def compute_pool_sell_price(
    *,
    escrow_pool: float | Decimal,
    outcome_price: float | Decimal,
    outcome_total_shares: float | Decimal,
) -> Decimal:
    """Fully-collateralized sell price per share (pre-resolution exit).

    A pre-resolution sell must be backed by funds already in the market, never
    by the platform. The market will pay AT MOST ``escrow_pool`` in total, and
    this outcome's expected claim on the pool is ``escrow_pool * outcome_price``
    (outcome_price is the AMM's win-probability estimate, 0..1). Splitting that
    across the outcome's shares gives a per-share exit value that can never make
    the sum of all exits exceed the pool:

        price = (escrow_pool * outcome_price) / outcome_total_shares

    Returns 0 when there are no shares or nothing to back the exit.
    """
    pool = Decimal(str(escrow_pool or 0))
    prob = Decimal(str(outcome_price or 0))
    total_shares = Decimal(str(outcome_total_shares or 0))
    if pool <= 0 or prob <= 0 or total_shares <= 0:
        return Decimal("0")
    price = (pool * prob) / total_shares
    # Never exceed 1π/share (the settlement ceiling) — a thin market could push
    # the raw figure above 1, which would over-pay relative to a winning share.
    return min(_quantize(price), Decimal("1.0000"))


def amounts_match(expected: Decimal, actual: float | Decimal | None) -> bool:
    if actual is None:
        return False
    actual_dec = Decimal(str(actual))
    return abs(expected - actual_dec) <= AMOUNT_TOLERANCE


def validate_breakdown_fields(
    *,
    amount: float | None,
    fee: float | None,
    total_cost: float | None,
    breakdown: TradeBreakdown,
) -> None:
    """Reject client-supplied amounts that do not match the server breakdown."""
    if amount is not None and not amounts_match(breakdown.amount, amount):
        raise ValueError(
            f"amount mismatch: expected {breakdown.amount}, got {amount}"
        )
    if fee is not None and not amounts_match(breakdown.fee, fee):
        raise ValueError(f"fee mismatch: expected {breakdown.fee}, got {fee}")
    if total_cost is not None and not amounts_match(breakdown.total_cost, total_cost):
        raise ValueError(
            f"total_cost mismatch: expected {breakdown.total_cost}, got {total_cost}"
        )


def validate_price_match(client_price: float, server_price: float) -> None:
    if not amounts_match(Decimal(str(server_price)), client_price):
        raise ValueError(
            f"price mismatch: market price is {server_price}, got {client_price}"
        )

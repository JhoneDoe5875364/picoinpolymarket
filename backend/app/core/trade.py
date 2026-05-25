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

from __future__ import annotations

import math
from datetime import datetime
from decimal import Decimal

from sqlalchemy import case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.market import Market
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_token import MarketToken
from app.models.tables.market_trades import MarketTrade

PRICE_STEP = Decimal("0.0001")
FEE_RATE = Decimal("0.02")


def amm_price(
    *,
    yes_pi_amount: Decimal,
    no_pi_amount: Decimal,
    liquidity: Decimal,
) -> tuple[Decimal, Decimal]:
    """Return YES/NO token prices from cumulative market liquidity state."""
    safe_yes = max(yes_pi_amount, Decimal("0"))
    safe_no = max(no_pi_amount, Decimal("0"))
    safe_liquidity = max(liquidity, Decimal("0"))
    denominator = safe_yes + safe_no + safe_liquidity

    if denominator <= 0:
        return Decimal("0.5000"), Decimal("0.5000")

    price_yes = (safe_yes + (safe_liquidity / Decimal("2"))) / denominator
    price_yes = min(max(price_yes, Decimal("0")), Decimal("1")).quantize(PRICE_STEP)
    price_no = (Decimal("1.0000") - price_yes).quantize(PRICE_STEP)
    return price_yes, price_no


def lmsr_price(q_yes: float, q_no: float, b: float) -> tuple[float, float]:
    """Return LMSR YES/NO price pair."""
    if b <= 0:
        raise ValueError("b must be > 0")

    e_yes = math.exp(q_yes / b)
    e_no = math.exp(q_no / b)

    p_yes = e_yes / (e_yes + e_no)
    p_no = 1 - p_yes
    return p_yes, p_no


async def insert_market_trade(
    session: AsyncSession,
    user_id: int,
    market_id: int,
    outcome: str,
    shares: Decimal,
    created_at: datetime,
    side: str = "BUY",
) -> MarketTrade:
    normalized_outcome = outcome.upper()
    if normalized_outcome not in ("YES", "NO"):
        raise ValueError("outcome must be YES or NO")

    normalized_side = side.upper()
    if normalized_side not in ("BUY", "SELL"):
        raise ValueError("side must be BUY or SELL")

    quant = PRICE_STEP
    normalized_shares = Decimal(str(shares)).quantize(quant)
    if normalized_shares <= 0:
        raise ValueError("shares must be greater than 0")

    token_row = await session.execute(
        select(MarketToken.token, MarketToken.price).where(
            MarketToken.market_id == market_id,
            MarketToken.outcome == normalized_outcome,
        )
    )
    token, price = token_row.one_or_none() or (None, None)
    if token is None or price is None:
        raise ValueError("Market token not found")

    normalized_price = Decimal(str(price)).quantize(quant)
    # pi_amount is the gross (price * shares) for both directions so the AMM
    # liquidity math in update_market_price stays symmetric. For a SELL,
    # pi_total_amount is the net proceeds (gross - fee) actually paid out.
    pi_amount = (normalized_price * normalized_shares).quantize(quant)
    pi_fee = (pi_amount * FEE_RATE).quantize(quant)
    if normalized_side == "SELL":
        pi_total_amount = (pi_amount - pi_fee).quantize(quant)
    else:
        pi_total_amount = (pi_amount + pi_fee).quantize(quant)

    trade = MarketTrade(
        token=token,
        market_id=market_id,
        taker_user_id=user_id,
        maker_user_id=1,
        side=normalized_side,
        outcome=normalized_outcome,
        price=normalized_price,
        shares=normalized_shares,
        pi_amount=pi_amount,
        pi_fee=pi_fee,
        pi_total_amount=pi_total_amount,
        created_at=created_at,
    )
    session.add(trade)
    await session.flush()
    return trade


async def add_to_escrow_pool(session: AsyncSession, market_id: int, amount: Decimal) -> None:
    """Credit staked principal (fee-excluded) to the market's escrow pool on buy."""
    amt = Decimal(str(amount)).quantize(PRICE_STEP)
    if amt <= 0:
        return
    await session.execute(
        update(Market)
        .where(Market.id == market_id)
        .values(
            escrow_pool=(func.coalesce(Market.escrow_pool, Decimal("0")) + amt),
            gross_staked=(func.coalesce(Market.gross_staked, Decimal("0")) + amt),
        )
    )


async def deduct_from_escrow_pool(
    session: AsyncSession, market_id: int, amount: Decimal, *, allow_negative: bool = False
) -> Decimal:
    """Debit the escrow pool on sell refund / winner payout. Returns new balance.

    Refuses to go negative unless allow_negative (used only during controlled
    backfill). The escrow pool is the market's own money — a debit larger than
    the balance means an accounting bug upstream.
    """
    amt = Decimal(str(amount)).quantize(PRICE_STEP)
    row = await session.execute(select(Market.escrow_pool).where(Market.id == market_id))
    current = row.scalar_one_or_none()
    current = Decimal(str(current or 0))
    if not allow_negative and amt > current:
        raise ValueError(
            f"escrow underflow: market {market_id} pool={current} < debit {amt}"
        )
    await session.execute(
        update(Market)
        .where(Market.id == market_id)
        .values(
            escrow_pool=(func.coalesce(Market.escrow_pool, Decimal("0")) - amt),
            gross_paid_out=(func.coalesce(Market.gross_paid_out, Decimal("0")) + amt),
        )
    )
    return (current - amt).quantize(PRICE_STEP)


async def credit_escrow_pool_reversal(
    session: AsyncSession, market_id: int, amount: Decimal
) -> None:
    """Undo a prior escrow debit (e.g. a sell whose payout later failed).

    Adds `amount` back to escrow_pool and subtracts it from gross_paid_out, so
    the audit totals stay consistent — this is NOT new stake.
    """
    amt = Decimal(str(amount)).quantize(PRICE_STEP)
    if amt <= 0:
        return
    await session.execute(
        update(Market)
        .where(Market.id == market_id)
        .values(
            escrow_pool=(func.coalesce(Market.escrow_pool, Decimal("0")) + amt),
            gross_paid_out=(func.coalesce(Market.gross_paid_out, Decimal("0")) - amt),
        )
    )


async def update_market_price(session: AsyncSession, trade: MarketTrade) -> None:
    quant = PRICE_STEP

    # Volume is a cumulative "how much was traded" figure, so a SELL adds to it
    # just like a BUY (turnover, not net flow).
    await session.execute(
        update(Market)
        .where(Market.id == trade.market_id)
        .values(
            volume=(func.coalesce(Market.volume, Decimal("0")) + trade.pi_amount).cast(Market.volume.type),
            updated_at=trade.created_at,
        )
    )

    market_row = await session.execute(select(Market.liquidity).where(Market.id == trade.market_id))
    liquidity = market_row.scalar_one_or_none()
    if liquidity is None:
        raise ValueError("Market not found")

    # Net liquidity per outcome: a BUY adds pi_amount to the pool, a SELL removes
    # it. The amm_price() max(...,0) guards keep a pool from going negative.
    signed_pi_amount = case(
        (MarketTrade.side == "SELL", -MarketTrade.pi_amount),
        else_=MarketTrade.pi_amount,
    )
    totals_row = await session.execute(
        select(
            func.coalesce(
                func.sum(signed_pi_amount).filter(MarketTrade.outcome == "YES"),
                Decimal("0"),
            ),
            func.coalesce(
                func.sum(signed_pi_amount).filter(MarketTrade.outcome == "NO"),
                Decimal("0"),
            ),
        ).where(MarketTrade.market_id == trade.market_id)
    )
    yes_pi_amount, no_pi_amount = totals_row.one()
    yes_pi_amount = Decimal(str(yes_pi_amount)).quantize(quant)
    no_pi_amount = Decimal(str(no_pi_amount)).quantize(quant)

    next_yes_price, next_no_price = amm_price(
        yes_pi_amount=yes_pi_amount,
        no_pi_amount=no_pi_amount,
        liquidity=Decimal(str(liquidity)),
    )

    await session.execute(
        update(MarketToken)
        .where(MarketToken.market_id == trade.market_id, MarketToken.outcome == "YES")
        .values(price=next_yes_price)
    )
    await session.execute(
        update(MarketToken)
        .where(MarketToken.market_id == trade.market_id, MarketToken.outcome == "NO")
        .values(price=next_no_price)
    )
    await session.flush()


async def update_market_position(session: AsyncSession, trade: MarketTrade) -> None:
    quant = PRICE_STEP

    position_row = await session.execute(
        select(MarketPosition).where(
            MarketPosition.market_id == trade.market_id,
            MarketPosition.user_id == trade.taker_user_id,
            MarketPosition.outcome == trade.outcome,
        )
    )
    position = position_row.scalar_one_or_none()

    if position is None:
        shares = Decimal(str(trade.shares)).quantize(quant)
        pi_amount = Decimal(str(trade.pi_amount)).quantize(quant)
        avg_price = (pi_amount / shares).quantize(quant)
        session.add(
            MarketPosition(
                market_id=trade.market_id,
                user_id=trade.taker_user_id,
                side=trade.side,
                outcome=trade.outcome,
                token=trade.token,
                shares=shares,
                pi_amount=pi_amount,
                avg_price=avg_price,
                final_price=None,
                is_claimed=False,
                created_at=trade.created_at,
                updated_at=trade.created_at,
            )
        )
        await session.flush()
        return

    updated_shares = (Decimal(str(position.shares)) + Decimal(str(trade.shares))).quantize(quant)
    updated_pi_amount = (Decimal(str(position.pi_amount)) + Decimal(str(trade.pi_amount))).quantize(quant)
    updated_avg_price = (updated_pi_amount / updated_shares).quantize(quant)

    await session.execute(
        update(MarketPosition)
        .where(MarketPosition.id == position.id)
        .values(
            side=trade.side,
            token=trade.token,
            shares=updated_shares,
            pi_amount=updated_pi_amount,
            avg_price=updated_avg_price,
            updated_at=trade.created_at,
        )
    )
    await session.flush()


async def reduce_market_position(
    session: AsyncSession,
    *,
    market_id: int,
    user_id: int,
    outcome: str,
    sell_shares: Decimal,
    updated_at: datetime,
) -> dict[str, object]:
    """Decrement a holding when the user sells. Returns the resulting state.

    Locks the position row (FOR UPDATE) so two concurrent sells cannot both
    consume the same shares. ``avg_price`` is preserved so the remaining shares
    keep their original cost basis; only ``pi_amount`` is prorated down. When
    the last share is sold the position is marked closed.
    """
    quant = PRICE_STEP
    normalized_outcome = outcome.upper()
    normalized_sell = Decimal(str(sell_shares)).quantize(quant)
    if normalized_sell <= 0:
        raise ValueError("sell shares must be greater than 0")

    position_row = await session.execute(
        select(MarketPosition)
        .where(
            MarketPosition.market_id == market_id,
            MarketPosition.user_id == user_id,
            MarketPosition.outcome == normalized_outcome,
        )
        .with_for_update()
    )
    position = position_row.scalar_one_or_none()
    if position is None:
        raise ValueError("No position to sell")

    current_shares = Decimal(str(position.shares)).quantize(quant)
    if position.is_closed or current_shares <= 0:
        raise ValueError("Position is already closed")
    if normalized_sell > current_shares:
        raise ValueError("Sell exceeds holdings")

    avg_price = Decimal(str(position.avg_price))
    remaining_shares = (current_shares - normalized_sell).quantize(quant)
    remaining_pi_amount = (remaining_shares * avg_price).quantize(quant)
    is_closed = remaining_shares <= 0

    await session.execute(
        update(MarketPosition)
        .where(MarketPosition.id == position.id)
        .values(
            shares=remaining_shares if not is_closed else Decimal("0.0000"),
            pi_amount=remaining_pi_amount if not is_closed else Decimal("0.0000"),
            is_closed=is_closed,
            updated_at=updated_at,
        )
    )
    await session.flush()
    return {
        "position_id": int(position.id),
        "remaining_shares": float(remaining_shares if not is_closed else Decimal("0")),
        "is_closed": is_closed,
    }


async def restore_market_position(
    session: AsyncSession,
    *,
    position_id: int,
    add_shares: Decimal,
    avg_price: Decimal,
    updated_at: datetime,
) -> None:
    """Undo a reservation: add shares back after an A2U payout failed.

    Called only when the position was already reduced (PAYING) but the payout did
    not go through. Re-opens the position (is_closed=False) and restores pi_amount
    at the preserved cost basis so the user keeps exactly what they had.
    """
    quant = PRICE_STEP
    restored = Decimal(str(add_shares)).quantize(quant)
    if restored <= 0:
        return

    position_row = await session.execute(
        select(MarketPosition).where(MarketPosition.id == position_id).with_for_update()
    )
    position = position_row.scalar_one_or_none()
    if position is None:
        raise ValueError("Position to restore not found")

    new_shares = (Decimal(str(position.shares)) + restored).quantize(quant)
    new_pi_amount = (new_shares * Decimal(str(avg_price))).quantize(quant)

    await session.execute(
        update(MarketPosition)
        .where(MarketPosition.id == position_id)
        .values(
            shares=new_shares,
            pi_amount=new_pi_amount,
            is_closed=False,
            updated_at=updated_at,
        )
    )
    await session.flush()

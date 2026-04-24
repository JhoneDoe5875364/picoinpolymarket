from __future__ import annotations

import math
from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select, update
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
) -> MarketTrade:
    normalized_outcome = outcome.upper()
    if normalized_outcome not in ("YES", "NO"):
        raise ValueError("outcome must be YES or NO")

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
    pi_amount = (normalized_price * normalized_shares).quantize(quant)
    pi_fee = (pi_amount * FEE_RATE).quantize(quant)
    pi_total_amount = (pi_amount + pi_fee).quantize(quant)

    trade = MarketTrade(
        token=token,
        market_id=market_id,
        taker_user_id=user_id,
        maker_user_id=1,
        side="BUY",
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


async def update_market_price(session: AsyncSession, trade: MarketTrade) -> None:
    quant = PRICE_STEP

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

    totals_row = await session.execute(
        select(
            func.coalesce(
                func.sum(MarketTrade.pi_amount).filter(MarketTrade.outcome == "YES"),
                Decimal("0"),
            ),
            func.coalesce(
                func.sum(MarketTrade.pi_amount).filter(MarketTrade.outcome == "NO"),
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

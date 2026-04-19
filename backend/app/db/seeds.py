"""Idempotent dev/demo seed rows."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import random

from sqlalchemy import select
from sqlalchemy.dialects.postgresql.ext import ts_headline
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils import generate_bigint_64

from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.user import User
from app.models.tables.market_trades import MarketTrade
from app.models.tables.market_price_candles import MarketPriceCandle
from app.models.tables.market_position import MarketPosition
from app.models.tables.leaderboard import Leaderboard


async def _ensure_user(session: AsyncSession, **kwargs: object) -> None:
    session.add(User(**kwargs))


async def _ensure_category(session: AsyncSession, **kwargs: object) -> None:
    session.add(Category(**kwargs))


async def _ensure_market(session: AsyncSession, **kwargs: object) -> None:
    session.add(Market(**kwargs))


async def _ensure_market_trade(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketTrade(**kwargs))


async def _ensure_market_price_candle(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketPriceCandle(**kwargs))


async def _ensure_market_position(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketPosition(**kwargs))


async def _ensure_leaderboard(session: AsyncSession, **kwargs: object) -> None:
    session.add(Leaderboard(**kwargs))


async def run_seeds(session: AsyncSession) -> None:
    """Insert seed rows if missing."""
    await run_seed_categories(session)
    await session.flush()
    await run_seed_users(session)
    await session.flush()
    await run_seed_markets(session)
    await session.flush()
    await run_seed_market_trades(session)
    await session.flush()
    await run_seed_market_price_candles(session)
    await session.flush()
    await run_seed_market_holders(session)
    await session.flush()
    await run_seed_leaderboard(session)
    await session.flush()


async def run_seed_categories(session: AsyncSession) -> None:
    now: datetime = datetime.now(timezone.utc)
    await _ensure_category(
        session,
        id=1,
        slug="politics",
        name="Politics",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=2,
        slug="sports",
        name="Sports",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=3,
        slug="crypto",
        name="Crypto",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=4,
        slug="esports",
        name="Esports",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=5,
        slug="finance",
        name="Finance",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=6,
        slug="geopolitics",
        name="Geopolitics",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=7,
        slug="tech",
        name="Tech",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=8,
        slug="culture",
        name="Culture",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=9,
        slug="economy",
        name="Economy",
        created_at=now,
    )
    await _ensure_category(
        session,
        id=10,
        slug="weather",
        name="Weather",
        created_at=now,
    )


async def run_seed_users(session: AsyncSession) -> None:
    now: datetime = datetime.now(timezone.utc)
    await _ensure_user(
        session,
        id=1,
        pi_username="seed_admin",
        pi_uid="seed-admin",
        role_id=2,
        balance=Decimal("10000"),
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
    await _ensure_user(
        session,
        id=2,
        pi_username="seed_user_1",
        pi_uid="seed-user-1",
        role_id=3,
        balance=Decimal("500"),
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
    await _ensure_user(
        session,
        id=3,
        pi_username="seed_user_2",
        pi_uid="seed-user-2",
        role_id=3,
        balance=Decimal("2654"),
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
    await _ensure_user(
        session,
        id=4,
        pi_username="seed_user_3",
        pi_uid="seed-user-3",
        role_id=3,
        balance=Decimal("12654"),
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )


async def run_seed_markets(session: AsyncSession) -> None:
    r = await session.execute(select(User.id).where(User.pi_username == "seed_admin"))
    admin_id = r.scalar_one_or_none()
    if admin_id is None:
        return

    now: datetime = datetime.now(timezone.utc)
    await _ensure_market(
        session,
        id=100000,
        question="Sample market A: Will demo prediction resolve Yes?",
        slug="seed-demo-market-a",
        description="Seed data for local development.",
        icon="http://localhost:9002/icon.png",
        category_id=1,
        creator_id=admin_id,
        tier="standard",
        token_yes_id=str(generate_bigint_64()),
        token_no_id=str(generate_bigint_64()),
        start_date=now - timedelta(days=5),
        end_date=now + timedelta(days=15),
        liquidity=Decimal("1000"),
        volume=Decimal("1000"),
        is_active=True,
        is_closed=False,
        is_archived=False,
        is_resolved=False,
        rules=(
            "This demo market resolves to YES only if the official announcement confirms the event outcome by the end date. "
            "Only publicly verifiable sources listed by the platform moderators are accepted for final resolution.\n\n"
            "If the source is ambiguous, delayed, or contradictory, the market may remain pending until clarification is posted. "
            "Trades executed before resolution are final and cannot be reversed except for clear technical incidents. "
            "The resolution note will include evidence links so participants can review why the outcome was decided."
        ),
        outcome_price_yes=Decimal("0.5"),
        outcome_price_no=Decimal("0.5"),
        created_at=now,
        updated_at=now,
    )
    await _ensure_market(
        session,
        id=100001,
        question="Sample market B: Second demo outcome?",
        slug="seed-demo-market-b",
        description="Seed data for local development.",
        icon="http://localhost:9002/icon.png",
        category_id=2,
        creator_id=admin_id,
        tier="standard",
        token_yes_id=str(generate_bigint_64()),
        token_no_id=str(generate_bigint_64()),
        start_date=now - timedelta(days=10),
        end_date=now + timedelta(days=10),
        liquidity=Decimal("1000"),
        volume=Decimal("10000"),
        is_active=True,
        is_closed=False,
        is_archived=False,
        is_resolved=False,
        rules=(
            "This market resolves based on whether the second demo condition is met within the stated market window. "
            "The evaluation uses timestamped public records and follows UTC as the reference timezone.\n\n"
            "Temporary outages or missing updates do not immediately trigger cancellation if reliable data is later restored. "
            "If the required condition is not satisfied before the deadline, the market resolves to NO. "
            "Moderators will publish a brief decision summary to explain the final verdict."
        ),
        outcome_price_yes=Decimal("0.5"),
        outcome_price_no=Decimal("0.5"),
        created_at=now,
        updated_at=now,
    )
    await _ensure_market(
        session,
        id=100002,
        question="Sample market C: Third demo outcome?",
        slug="seed-demo-market-c",
        description="Seed data for local development.",
        icon="http://localhost:9002/icon.png",
        category_id=3,
        creator_id=admin_id,
        tier="standard",
        token_yes_id=str(generate_bigint_64()),
        token_no_id=str(generate_bigint_64()),
        start_date=now - timedelta(days=2),
        end_date=now + timedelta(days=30),
        liquidity=Decimal("1000"),
        volume=Decimal("100000"),
        is_active=True,
        is_closed=False,
        is_archived=False,
        is_resolved=False,
        rules=(
            "This market resolves to YES when the third demo outcome is confirmed by an approved reference source. "
            "The source must provide enough detail to verify that the exact condition in the question has occurred.\n\n"
            "If no conclusive evidence appears before expiration, the market resolves to NO by default. "
            "Any late evidence published after the cutoff is not considered for settlement. "
            "A final resolution message is posted in the market feed with the supporting citation."
        ),
        outcome_price_yes=Decimal("0.5"),
        outcome_price_no=Decimal("0.5"),
        created_at=now,
        updated_at=now,
    )


async def run_seed_market_trades(session: AsyncSession) -> None:
    market_id = 100000
    mr = await session.execute(
        select(Market.token_yes_id, Market.token_no_id).where(Market.id == market_id)
    )
    mrow = mr.one_or_none()
    if mrow is None:
        print("No market found for ID", market_id)
        return
    
    token_yes_id, token_no_id = mrow[0], mrow[1]
    if not token_yes_id or not token_no_id:
        print("No token IDs found for market", market_id)
        return

    now: datetime = datetime.now(timezone.utc)

    await _ensure_market_trade(
        session,
        token_id=token_yes_id,
        market_id=market_id,
        taker_user_id=2,
        maker_user_id=1,
        side="BUY",
        outcome="YES",
        price=Decimal("0.5"),
        shares=Decimal("1000"),
        pi_amount=Decimal("500"),
        pi_fee=Decimal("10"),
        pi_total_amount=Decimal("510"),
        created_at=now - timedelta(hours=2),
    )
    await _ensure_market_trade(
        session,
        token_id=token_no_id,
        market_id=market_id,
        taker_user_id=2,
        maker_user_id=1,
        side="SELL",
        outcome="NO",
        price=Decimal("0.35"),
        shares=Decimal("1000"),
        pi_amount=Decimal("350"),
        pi_fee=Decimal("7"),
        pi_total_amount=Decimal("357"),
        created_at=now - timedelta(hours=1),
    )
    await _ensure_market_trade(
        session,
        token_id=token_yes_id,
        market_id=market_id,
        taker_user_id=2,
        maker_user_id=1,
        side="BUY",
        outcome="YES",
        price=Decimal("0.75"),
        shares=Decimal("1000"),
        pi_amount=Decimal("750"),
        pi_fee=Decimal("15"),
        pi_total_amount=Decimal("765"),
        created_at=now,
    )


async def run_seed_market_price_candles(session: AsyncSession) -> None:
    market_id = 100000
    mr = await session.execute(select(Market.token_yes_id, Market.token_no_id).where(Market.id == market_id))
    mrow = mr.one_or_none()
    if mrow is None:
        print("No market found for ID", market_id)
        return
        
    token_yes_id, token_no_id = mrow[0], mrow[1]
    if not token_yes_id or not token_no_id:
        print("No token IDs found for market", market_id)
        return

    now: datetime = datetime.now(timezone.utc)
    latest_ts = int(now.timestamp())
    price_step = Decimal("0.0001")
    min_price = Decimal("0.0100")
    max_price = Decimal("0.9900")

    close_price = Decimal("0.5000")
    for minute_offset in range(119, -1, -1):
        ts = latest_ts - (minute_offset * 60)
        open_price = close_price

        delta = Decimal(str(random.uniform(-0.02, 0.02))).quantize(price_step)
        close_price = (open_price + delta).quantize(price_step)
        close_price = min(max(close_price, min_price), max_price)

        wick_up = Decimal(str(random.uniform(0, 0.01))).quantize(price_step)
        wick_down = Decimal(str(random.uniform(0, 0.01))).quantize(price_step)
        high_price = min(max(open_price, close_price) + wick_up, max_price).quantize(price_step)
        low_price = max(min(open_price, close_price) - wick_down, min_price).quantize(price_step)

        volume = Decimal(random.randint(500, 5000))

        await _ensure_market_price_candle(
            session,
            market_id=market_id,
            token_id=token_yes_id,
            ts=ts,
            open_price=open_price,
            high_price=high_price,
            low_price=low_price,
            close_price=close_price,
            volume=volume,
        )


async def run_seed_market_holders(session: AsyncSession) -> None:
    market_id = 100000
    mr = await session.execute(select(Market.token_yes_id, Market.token_no_id).where(Market.id == market_id))
    mrow = mr.one_or_none()
    if mrow is None:
        print("No market found for ID", market_id)
        return
        
    token_yes_id, token_no_id = mrow[0], mrow[1]
    if not token_yes_id or not token_no_id:
        print("No token IDs found for market", market_id)
        return

    now: datetime = datetime.now(timezone.utc)

    await _ensure_market_position(
        session,
        market_id=market_id,
        user_id=2,
        yes_token_id=token_yes_id,
        no_token_id=token_no_id,
        yes_shares=Decimal("1000"),
        no_shares=Decimal("500"),
        yes_pi_amount=Decimal("650"),
        no_pi_amount=Decimal("175"),
        avg_price_yes=Decimal("0.65"),
        avg_price_no=Decimal("0.35"),
        created_at=now,
        updated_at=now,
    )
    await _ensure_market_position(
        session,
        market_id=market_id,
        user_id=3,
        yes_token_id=token_yes_id,
        no_token_id=token_no_id,
        yes_shares=Decimal("500"),
        no_shares=Decimal("200"),
        yes_pi_amount=Decimal("375"),
        no_pi_amount=Decimal("50"),
        avg_price_yes=Decimal("0.75"),
        avg_price_no=Decimal("0.25"),
        created_at=now,
        updated_at=now,
    )
    await _ensure_market_position(
        session,
        market_id=market_id,
        user_id=4,
        yes_token_id=token_yes_id,
        no_token_id=token_no_id,
        yes_shares=Decimal("2000"),
        no_shares=Decimal("3000"),
        yes_pi_amount=Decimal("700"),
        no_pi_amount=Decimal("1800"),
        avg_price_yes=Decimal("0.35"),
        avg_price_no=Decimal("0.60"),
        created_at=now,
        updated_at=now,
    )


async def run_seed_leaderboard(session: AsyncSession) -> None:
    market_id = 100000
    category_id = 1
    time_bucket = "1d"
    user_id = 2
    user_id_2 = 3
    user_id_3 = 4

    mr = await session.execute(select(Category.id).where(Category.id == category_id))
    crow = mr.one_or_none()
    if crow is None:
        print("No category found for ID", category_id)
        return

    ur = await session.execute(select(User).where(User.id == user_id))
    urow = ur.scalar_one_or_none()
    if urow is None:
        print("No user found for ID", user_id)
        return

    ur = await session.execute(select(User).where(User.id == user_id_2))
    urow_2 = ur.scalar_one_or_none()
    if urow_2 is None:
        print("No user found for ID", user_id_2)
        return

    ur = await session.execute(select(User).where(User.id == user_id_3))
    urow_3 = ur.scalar_one_or_none()
    if urow_3 is None:
        print("No user found for ID", user_id_3)
        return

    now: datetime = datetime.now(timezone.utc)

    await _ensure_leaderboard(
        session,
        id=1,
        category_id=category_id,
        time_bucket=time_bucket,
        user_id=user_id,
        pi_user_id=urow.pi_uid,
        pi_username=urow.pi_username,
        wallet_address='',
        vol=Decimal("3000"),
        pnl=Decimal("300"),
        created_at=now,
        updated_at=now,
    )
    await _ensure_leaderboard(
        session,
        id=2,
        category_id=category_id,
        time_bucket=time_bucket,
        user_id=user_id_2,
        pi_user_id=urow_2.pi_uid,
        pi_username=urow_2.pi_username,
        wallet_address='',
        vol=Decimal("2000"),
        pnl=Decimal("200"),
        created_at=now,
        updated_at=now,
    )
    await _ensure_leaderboard(
        session,
        id=3,
        category_id=category_id,
        time_bucket=time_bucket,
        user_id=user_id_3,
        pi_user_id=urow_3.pi_uid,
        pi_username=urow_3.pi_username,
        wallet_address='',
        vol=Decimal("1000"),
        pnl=Decimal("100"),
        created_at=now,
        updated_at=now,
    )
        


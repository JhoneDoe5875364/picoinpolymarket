"""Idempotent dev/demo seed rows."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.user import User
from app.models.tables.market_trades import MarketTrade

from app.utils import generate_bigint_256


async def _ensure_user(session: AsyncSession, **kwargs: object) -> None:
    username = kwargs.get("pi_username")
    assert isinstance(username, str)
    r = await session.execute(select(User.id).where(User.pi_username == username))
    if r.first():
        return
    kwargs.pop("id", None)
    session.add(User(**kwargs))


async def _ensure_category(session: AsyncSession, **kwargs: object) -> None:
    cid = kwargs["id"]
    assert isinstance(cid, int)
    r = await session.execute(select(Category.id).where(Category.id == cid))
    if r.first():
        return
    session.add(Category(**kwargs))


async def _ensure_market(session: AsyncSession, **kwargs: object) -> None:
    id = kwargs.get("id")
    assert isinstance(id, int)
    r = await session.execute(select(Market.id).where(Market.id == id))
    if r.first():
        return
    session.add(Market(**kwargs))


async def _ensure_market_trade(session: AsyncSession, **kwargs: object) -> None:
    token_id = kwargs.get("token_id")
    created_at = kwargs.get("created_at")
    assert isinstance(token_id, str)
    assert created_at is not None
    r = await session.execute(
        select(MarketTrade.id).where(
            MarketTrade.token_id == token_id,
            MarketTrade.created_at == created_at,
        ).limit(1)
    )
    if r.first():
        return
    kwargs.pop("id", None)
    session.add(MarketTrade(**kwargs))


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
        status="active",
        created_at=now,
        updated_at=now,
    )
    await _ensure_user(
        session,
        id=2,
        pi_username="seed_user",
        pi_uid="seed-user",
        role_id=3,
        balance=Decimal("500"),
        status="active",
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
        token_yes_id=str(generate_bigint_256()),
        token_no_id=str(generate_bigint_256()),
        start_date=now - timedelta(days=5),
        end_date=now + timedelta(days=15),
        liquidity=Decimal("1000"),
        volume=Decimal("1000"),
        is_active=True,
        is_closed=False,
        is_archived=False,
        is_resolved=False,
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
        token_yes_id=str(generate_bigint_256()),
        token_no_id=str(generate_bigint_256()),
        start_date=now - timedelta(days=10),
        end_date=now + timedelta(days=10),
        liquidity=Decimal("1000"),
        volume=Decimal("10000"),
        is_active=True,
        is_closed=False,
        is_archived=False,
        is_resolved=False,
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
        token_yes_id=str(generate_bigint_256()),
        token_no_id=str(generate_bigint_256()),
        start_date=now - timedelta(days=2),
        end_date=now + timedelta(days=30),
        liquidity=Decimal("1000"),
        volume=Decimal("100000"),
        is_active=True,
        is_closed=False,
        is_archived=False,
        is_resolved=False,
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
        side="buy",
        price=Decimal("0.5"),
        size=Decimal("1000"),
        amount=Decimal("500"),
        fee=Decimal("10"),
        created_at=now,
    )
    await _ensure_market_trade(
        session,
        token_id=token_no_id,
        market_id=market_id,
        taker_user_id=2,
        maker_user_id=1,
        side="sell",
        price=Decimal("0.35"),
        size=Decimal("1000"),
        amount=Decimal("350"),
        fee=Decimal("7"),
        created_at=now,
    )
    await _ensure_market_trade(
        session,
        token_id=token_yes_id,
        market_id=market_id,
        taker_user_id=2,
        maker_user_id=1,
        side="buy",
        price=Decimal("0.75"),
        size=Decimal("1000"),
        amount=Decimal("750"),
        fee=Decimal("15"),
        created_at=now,
    )
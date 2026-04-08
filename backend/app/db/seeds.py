"""Idempotent dev/demo seed rows (deterministic UUIDs)."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.user import User


def _seed_uuid(label: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"predictpix.seed.{label}")


async def _ensure_user(session: AsyncSession, **kwargs: object) -> None:
    uid = kwargs["id"]
    assert isinstance(uid, uuid.UUID)
    r = await session.execute(select(User.id).where(User.id == uid))
    if r.first():
        return
    session.add(User(**kwargs))


async def _ensure_category(session: AsyncSession, **kwargs: object) -> None:
    cid = kwargs["id"]
    assert isinstance(cid, int)
    r = await session.execute(select(Category.id).where(Category.id == cid))
    if r.first():
        return
    session.add(Category(**kwargs))


async def _ensure_market(session: AsyncSession, **kwargs: object) -> None:
    mid = kwargs["id"]
    assert isinstance(mid, uuid.UUID)
    r = await session.execute(select(Market.id).where(Market.id == mid))
    if r.first():
        return
    session.add(Market(**kwargs))


async def run_seeds(session: AsyncSession) -> None:
    """Insert seed rows if missing."""
    admin_id = _seed_uuid("user.admin")

    await run_seed_categories(session)
    await run_seed_users(session, admin_id)
    await run_seed_markets(session, admin_id)


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


async def run_seed_users(session: AsyncSession, admin_id: uuid.UUID) -> None:
    now: datetime = datetime.now(timezone.utc)
    await _ensure_user(
        session,
        id=admin_id,
        pi_username="seed_admin",
        role_id=2,
        balance=Decimal("10000"),
        status="active",
        created_at=now,
        updated_at=now,
    )
    await _ensure_user(
        session,
        id=_seed_uuid("user.regular"),
        pi_username="seed_user",
        role_id=3,
        balance=Decimal("500"),
        status="active",
        created_at=now,
        updated_at=now,
    )


async def run_seed_markets(session: AsyncSession, admin_id: uuid.UUID) -> None:
    now: datetime = datetime.now(timezone.utc)
    await _ensure_market(
        session,
        id=_seed_uuid("market.demo-a"),
        question="Sample market A: Will demo prediction resolve Yes?",
        slug="seed-demo-market-a",
        description="Seed data for local development.",
        icon="http://localhost:9002/icon.png",
        category_id=1,
        creator_id=admin_id,
        tier="standard",
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
        id=_seed_uuid("market.demo-b"),
        question="Sample market B: Second demo outcome?",
        slug="seed-demo-market-b",
        description="Seed data for local development.",
        icon="http://localhost:9002/icon.png",
        category_id=2,
        creator_id=admin_id,
        tier="standard",
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
        id=_seed_uuid("market.demo-c"),
        question="Sample market C: Third demo outcome?",
        slug="seed-demo-market-c",
        description="Seed data for local development.",
        icon="http://localhost:9002/icon.png",
        category_id=3,
        creator_id=admin_id,
        tier="standard",
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
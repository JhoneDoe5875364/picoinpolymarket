"""Idempotent dev/demo seed rows."""

from __future__ import annotations

from collections import defaultdict
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
    await run_seed_market_positions(session)
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
    adjective_pool = [
        "swift",
        "brave",
        "calm",
        "lucky",
        "sharp",
        "quiet",
        "bold",
        "rapid",
        "prime",
        "nova",
    ]
    noun_pool = [
        "falcon",
        "trader",
        "oracle",
        "pioneer",
        "pilot",
        "voyager",
        "miner",
        "analyst",
        "builder",
        "ranger",
    ]
    status_pool = ["ACTIVE", "ACTIVE", "ACTIVE", "SUSPENDED"]

    # Create 99 additional users (+ seed_admin = total 100 users)
    for user_id in range(2, 101):
        adjective = random.choice(adjective_pool)
        noun = random.choice(noun_pool)
        suffix = random.randint(100, 999)
        username = f"seed_{adjective}_{noun}_{suffix}"
        uid = f"seed-user-{user_id}-{suffix}"
        balance = Decimal(str(random.randint(100, 50000)))

        await _ensure_user(
            session,
            id=user_id,
            pi_username=username,
            pi_uid=uid,
            role_id=3,
            balance=balance,
            status=random.choice(status_pool),
            created_at=now,
            updated_at=now,
        )


async def run_seed_markets(session: AsyncSession) -> None:
    r = await session.execute(select(User.id).where(User.pi_username == "seed_admin"))
    admin_id = r.scalar_one_or_none()
    if admin_id is None:
        return

    now: datetime = datetime.now(timezone.utc)
    subjects = [
        "Bitcoin",
        "Ethereum",
        "S&P 500",
        "gold",
        "KOSPI",
        "Pi Network",
        "Tesla stock",
        "AI chip market",
        "global inflation",
        "US policy rate",
        "World Cup qualifier",
        "Olympic medal table",
        "major typhoon",
        "next blockbuster movie",
        "new smartphone launch",
        "top esports finals",
    ]
    predicates = [
        "close above",
        "stay below",
        "reach at least",
        "finish the month over",
        "record more than",
        "announce at least",
        "end with",
        "beat expectations by",
    ]
    targets = [
        "5%",
        "10%",
        "15%",
        "20%",
        "0.5%",
        "2 million units",
        "100,000 volume",
        "new all-time high",
        "quarterly growth",
        "double-digit returns",
    ]
    periods = [
        "this week",
        "this month",
        "by quarter end",
        "before year end",
        "within 30 days",
        "within 60 days",
        "before the next release cycle",
    ]
    rule_template = (
        "This market resolves to YES only if the exact question condition is met within the specified market window "
        "based on publicly verifiable data sources selected by moderators.\n\n"
        "If no conclusive evidence is available by the end date, the market resolves to NO. "
        "Resolution notes must include source links and timestamp context."
    )

    market_count = 200
    used_slugs: set[str] = set()
    for idx in range(market_count):
        market_id = 100000 + idx
        subject = random.choice(subjects)
        predicate = random.choice(predicates)
        target = random.choice(targets)
        period = random.choice(periods)

        question = f"Will {subject} {predicate} {target} {period}?"
        slug_base = question.lower().replace(" ", "-").replace("?", "").replace("&", "and").replace(".", "")
        slug = slug_base
        dedupe_seq = 2
        while slug in used_slugs:
            slug = f"{slug_base}-{dedupe_seq}"
            dedupe_seq += 1
        used_slugs.add(slug)

        start_date = now - timedelta(days=random.randint(1, 30))
        end_date = now + timedelta(days=random.randint(3, 120))

        yes_price_float = round(random.uniform(0.05, 0.95), 4)
        yes_price = Decimal(f"{yes_price_float:.4f}")
        no_price = (Decimal("1.0000") - yes_price).quantize(Decimal("0.0001"))

        liquidity = Decimal(str(random.randint(500, 15000)))
        volume = Decimal(str(random.randint(1000, 500000)))

        await _ensure_market(
            session,
            id=market_id,
            question=question,
            slug=slug,
            description="Auto-generated random seed market for local development.",
            icon="http://localhost:9002/icon.png",
            category_id=random.randint(1, 10),
            creator_id=admin_id,
            tier="standard",
            token_yes_id=str(generate_bigint_64()),
            token_no_id=str(generate_bigint_64()),
            start_date=start_date,
            end_date=end_date,
            liquidity=liquidity,
            volume=volume,
            is_active=True,
            is_closed=False,
            is_archived=False,
            is_resolved=False,
            rules=rule_template,
            outcome_price_yes=yes_price,
            outcome_price_no=no_price,
            created_at=now,
            updated_at=now,
        )


async def run_seed_market_trades(session: AsyncSession) -> None:
    market_rows = await session.execute(
        select(
            Market.id,
            Market.token_yes_id,
            Market.token_no_id,
            Market.outcome_price_yes,
            Market.outcome_price_no,
        ).where(Market.id >= 100000, Market.id < 100200)
    )
    markets = [
        (
            market_id,
            token_yes_id,
            token_no_id,
            outcome_price_yes,
            outcome_price_no,
        )
        for market_id, token_yes_id, token_no_id, outcome_price_yes, outcome_price_no in market_rows.all()
        if token_yes_id and token_no_id
    ]
    if not markets:
        print("No seeded markets found for trade seeding")
        return

    user_rows = await session.execute(select(User.id).where(User.id >= 2, User.id <= 100))
    user_ids = [user_id for (user_id,) in user_rows.all()]
    if not user_ids:
        print("No seeded users found for trade seeding")
        return

    now: datetime = datetime.now(timezone.utc)
    fee_rate = Decimal("0.02")
    min_price = Decimal("0.0100")
    max_price = Decimal("0.9900")
    price_step = Decimal("0.0001")

    trade_count = random.randint(10000, 20000)
    for _ in range(trade_count):
        market_id, token_yes_id, token_no_id, yes_base_price, no_base_price = random.choice(markets)
        outcome = random.choice(["YES", "NO"])
        token_id = token_yes_id if outcome == "YES" else token_no_id
        base_price = yes_base_price if outcome == "YES" else no_base_price
        if base_price is None:
            base_price = Decimal("0.5000")

        jitter = Decimal(str(random.uniform(-0.08, 0.08))).quantize(price_step)
        price = (base_price + jitter).quantize(price_step)
        price = min(max(price, min_price), max_price)

        shares = Decimal(str(random.randint(1, 3000)))
        pi_amount = (price * shares).quantize(price_step)
        pi_fee = (pi_amount * fee_rate).quantize(price_step)
        pi_total_amount = (pi_amount + pi_fee).quantize(price_step)

        taker_user_id = random.choice(user_ids)
        maker_user_id = random.choice(user_ids)
        if len(user_ids) > 1:
            while maker_user_id == taker_user_id:
                maker_user_id = random.choice(user_ids)

        created_at = now - timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        await _ensure_market_trade(
            session,
            token_id=token_id,
            market_id=market_id,
            taker_user_id=taker_user_id,
            maker_user_id=maker_user_id,
            side="BUY",
            outcome=outcome,
            price=price,
            shares=shares,
            pi_amount=pi_amount,
            pi_fee=pi_fee,
            pi_total_amount=pi_total_amount,
            created_at=created_at,
        )


async def run_seed_market_price_candles(session: AsyncSession) -> None:
    trades_result = await session.execute(
        select(
            MarketTrade.market_id,
            MarketTrade.outcome,
            MarketTrade.price,
            MarketTrade.shares,
            MarketTrade.created_at,
        ).order_by(MarketTrade.market_id, MarketTrade.outcome, MarketTrade.created_at)
    )
    trades = trades_result.all()
    if not trades:
        print("No market trades found for candle seeding")
        return

    market_ids = sorted({market_id for market_id, *_ in trades})
    market_result = await session.execute(
        select(Market.id, Market.token_yes_id, Market.token_no_id).where(Market.id.in_(market_ids))
    )
    market_token_map = {
        market_id: {"YES": token_yes_id, "NO": token_no_id}
        for market_id, token_yes_id, token_no_id in market_result.all()
    }

    buckets: dict[tuple[int, str, int], list[tuple[datetime, Decimal, Decimal]]] = defaultdict(list)
    for market_id, outcome, price, shares, created_at in trades:
        if outcome not in ("YES", "NO"):
            continue
        token_map = market_token_map.get(market_id)
        if token_map is None or not token_map.get(outcome):
            continue
        minute_ts = int(created_at.timestamp()) // 60 * 60
        buckets[(market_id, outcome, minute_ts)].append((created_at, price, shares))

    quant = Decimal("0.0001")
    for (market_id, outcome, ts), rows in sorted(buckets.items()):
        rows.sort(key=lambda row: row[0])
        prices = [row[1] for row in rows]
        open_price = rows[0][1].quantize(quant)
        close_price = rows[-1][1].quantize(quant)
        high_price = max(prices).quantize(quant)
        low_price = min(prices).quantize(quant)
        volume = sum((row[2] for row in rows), Decimal("0")).quantize(quant)
        token_id = market_token_map[market_id][outcome]
        if token_id is None:
            continue

        await _ensure_market_price_candle(
            session,
            market_id=market_id,
            token_id=token_id,
            ts=ts,
            open_price=open_price,
            high_price=high_price,
            low_price=low_price,
            close_price=close_price,
            volume=volume,
        )


def _build_position_stats(
    trades: list[tuple[int, int, str, str, Decimal, Decimal]]
) -> dict[tuple[int, int], dict[str, Decimal]]:
    stats: dict[tuple[int, int], dict[str, Decimal]] = defaultdict(
        lambda: {
            "yes_shares": Decimal("0"),
            "no_shares": Decimal("0"),
            "yes_pi_amount": Decimal("0"),
            "no_pi_amount": Decimal("0"),
        }
    )
    for user_id, market_id, side, outcome, shares, pi_amount in trades:
        key = (market_id, user_id)
        share_sign = Decimal("1") if side == "BUY" else Decimal("-1")
        amount_sign = Decimal("1") if side == "BUY" else Decimal("-1")
        if outcome == "YES":
            stats[key]["yes_shares"] += shares * share_sign
            stats[key]["yes_pi_amount"] += pi_amount * amount_sign
        elif outcome == "NO":
            stats[key]["no_shares"] += shares * share_sign
            stats[key]["no_pi_amount"] += pi_amount * amount_sign
    return stats


async def run_seed_market_positions(session: AsyncSession) -> None:
    market_result = await session.execute(select(Market.id, Market.token_yes_id, Market.token_no_id))
    market_map = {
        market_id: (token_yes_id, token_no_id)
        for market_id, token_yes_id, token_no_id in market_result.all()
    }

    trades_result = await session.execute(
        select(
            MarketTrade.taker_user_id,
            MarketTrade.market_id,
            MarketTrade.side,
            MarketTrade.outcome,
            MarketTrade.shares,
            MarketTrade.pi_amount,
        )
    )
    trades = trades_result.all()
    if not trades:
        print("No market trades found for position seeding")
        return

    position_stats = _build_position_stats(trades)
    now: datetime = datetime.now(timezone.utc)
    quant = Decimal("0.0001")

    for (market_id, user_id), stat in sorted(position_stats.items()):
        token_ids = market_map.get(market_id)
        if token_ids is None:
            continue
        yes_token_id, no_token_id = token_ids
        if not yes_token_id or not no_token_id:
            continue

        yes_shares = max(stat["yes_shares"], Decimal("0")).quantize(quant)
        no_shares = max(stat["no_shares"], Decimal("0")).quantize(quant)
        yes_pi_amount = max(stat["yes_pi_amount"], Decimal("0")).quantize(quant)
        no_pi_amount = max(stat["no_pi_amount"], Decimal("0")).quantize(quant)
        avg_price_yes = (yes_pi_amount / yes_shares).quantize(quant) if yes_shares > 0 else Decimal("0.0000")
        avg_price_no = (no_pi_amount / no_shares).quantize(quant) if no_shares > 0 else Decimal("0.0000")

        await _ensure_market_position(
            session,
            market_id=market_id,
            user_id=user_id,
            yes_token_id=yes_token_id,
            no_token_id=no_token_id,
            yes_shares=yes_shares,
            no_shares=no_shares,
            yes_pi_amount=yes_pi_amount,
            no_pi_amount=no_pi_amount,
            avg_price_yes=avg_price_yes,
            avg_price_no=avg_price_no,
            created_at=now,
            updated_at=now,
        )


async def run_seed_leaderboard(session: AsyncSession) -> None:
    trades_result = await session.execute(
        select(
            MarketTrade.taker_user_id,
            MarketTrade.market_id,
            MarketTrade.side,
            MarketTrade.outcome,
            MarketTrade.shares,
            MarketTrade.pi_amount,
        )
    )
    trades = trades_result.all()
    if not trades:
        print("No market trades found for leaderboard seeding")
        return

    market_result = await session.execute(
        select(Market.id, Market.category_id, Market.outcome_price_yes, Market.outcome_price_no)
    )
    market_map = {
        market_id: {
            "category_id": category_id,
            "yes_price": outcome_price_yes or Decimal("0"),
            "no_price": outcome_price_no or Decimal("0"),
        }
        for market_id, category_id, outcome_price_yes, outcome_price_no in market_result.all()
    }

    user_result = await session.execute(select(User.id, User.pi_uid, User.pi_username))
    user_map = {user_id: {"pi_uid": pi_uid, "pi_username": pi_username} for user_id, pi_uid, pi_username in user_result.all()}

    vol_by_user_category: dict[tuple[int, int], Decimal] = defaultdict(lambda: Decimal("0"))
    for user_id, market_id, *_rest, pi_amount in trades:
        market_info = market_map.get(market_id)
        if market_info is None or market_info["category_id"] is None:
            continue
        category_id = market_info["category_id"]
        vol_by_user_category[(user_id, category_id)] += pi_amount

    position_stats = _build_position_stats(trades)
    pnl_by_user_category: dict[tuple[int, int], Decimal] = defaultdict(lambda: Decimal("0"))
    for (market_id, user_id), stat in position_stats.items():
        market_info = market_map.get(market_id)
        if market_info is None or market_info["category_id"] is None:
            continue
        category_id = market_info["category_id"]
        yes_shares = max(stat["yes_shares"], Decimal("0"))
        no_shares = max(stat["no_shares"], Decimal("0"))
        yes_pi_amount = max(stat["yes_pi_amount"], Decimal("0"))
        no_pi_amount = max(stat["no_pi_amount"], Decimal("0"))
        mark_value = (yes_shares * market_info["yes_price"]) + (no_shares * market_info["no_price"])
        cost_basis = yes_pi_amount + no_pi_amount
        pnl_by_user_category[(user_id, category_id)] += mark_value - cost_basis

    now: datetime = datetime.now(timezone.utc)
    quant = Decimal("0.0001")
    leaderboard_id = 1
    time_bucket = "1D"

    all_keys = set(vol_by_user_category.keys()) | set(pnl_by_user_category.keys())
    sorted_keys = sorted(
        all_keys,
        key=lambda key: (vol_by_user_category.get(key, Decimal("0")), pnl_by_user_category.get(key, Decimal("0"))),
        reverse=True,
    )
    for user_id, category_id in sorted_keys:
        user_info = user_map.get(user_id)
        if user_info is None:
            continue
        vol = vol_by_user_category.get((user_id, category_id), Decimal("0")).quantize(quant)
        pnl = pnl_by_user_category.get((user_id, category_id), Decimal("0")).quantize(quant)
        await _ensure_leaderboard(
            session,
            id=leaderboard_id,
            category_id=category_id,
            time_bucket=time_bucket,
            user_id=user_id,
            pi_user_id=user_info["pi_uid"],
            pi_username=user_info["pi_username"],
            wallet_address="",
            vol=vol,
            pnl=pnl,
            created_at=now,
            updated_at=now,
        )
        leaderboard_id += 1
        


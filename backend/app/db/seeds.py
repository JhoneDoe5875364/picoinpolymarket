"""Idempotent dev/demo seed rows."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import random

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql.ext import ts_headline
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils import generate_bigint_64

from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.market_token import MarketToken
from app.models.tables.user import User
from app.models.tables.market_trades import MarketTrade
from app.models.tables.market_price_candles import MarketPriceCandle
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_volume_agg_state import MarketVolumeAggState
from app.models.tables.suggestion import Suggestion
from app.updator import leaderboard_updater, market_volume_updater


async def _ensure_user(session: AsyncSession, **kwargs: object) -> None:
    session.add(User(**kwargs))


async def _ensure_category(session: AsyncSession, **kwargs: object) -> None:
    session.add(Category(**kwargs))


async def _ensure_market(session: AsyncSession, **kwargs: object) -> None:
    session.add(Market(**kwargs))


async def _ensure_market_token(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketToken(**kwargs))


async def _ensure_market_trade(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketTrade(**kwargs))


async def _ensure_market_price_candle(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketPriceCandle(**kwargs))


async def _ensure_market_position(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketPosition(**kwargs))


async def _ensure_suggestion(session: AsyncSession, **kwargs: object) -> None:
    session.add(Suggestion(**kwargs))


async def _ensure_volume_agg_state(session: AsyncSession, **kwargs: object) -> None:
    session.add(MarketVolumeAggState(**kwargs))


async def _sync_table_sequence(session: AsyncSession, table_name: str, id_column: str = "id") -> None:
    await session.execute(
        text(
            f"""
            WITH seq AS (
                SELECT pg_get_serial_sequence('{table_name}', '{id_column}') AS seq_name
            )
            SELECT setval(
                seq.seq_name,
                COALESCE((SELECT MAX({id_column}) FROM {table_name}), 0) + 1,
                false
            )
            FROM seq
            WHERE seq.seq_name IS NOT NULL
            """
        )
    )


async def _sync_seed_sequences(session: AsyncSession) -> None:
    seed_tables = [
        "categories",
        "users",
        "suggestions",
        "markets",
        "market_tokens",
        "market_trades",
        "market_price_candles",
        "market_positions",
        "leaderboards",
    ]
    for table_name in seed_tables:
        await _sync_table_sequence(session, table_name)


async def run_seeds(session: AsyncSession) -> None:
    """Insert seed rows if missing."""
    await run_seed_categories(session)
    await session.flush()
    await run_seed_users(session)
    await session.flush()
    await run_seed_suggestions(session)
    await session.flush()
    await run_seed_markets(session)
    await session.flush()
    await run_seed_market_trades(session)
    await session.flush()
    await run_seed_market_price_candles(session)
    await session.flush()
    await run_seed_market_positions(session)
    await session.flush()
    await run_seed_volume_agg_state(session)
    await session.flush()
    await market_volume_updater.refresh_market_volume_1m(session, commit=False)
    await session.flush()
    await market_volume_updater.refresh_market_volume_1d(session, commit=False)
    await session.flush()
    # Seed path should run leaderboard aggregation once.
    await leaderboard_updater.rebuild_leaderboards(session, commit=False)
    await session.flush()
    await _sync_seed_sequences(session)
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
        pi_username="superadmin",
        pi_uid="superadmin",
        role_id=1,
        balance=Decimal("10000"),
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
    await _ensure_user(
        session,
        id=2,
        pi_username="admin",
        pi_uid="admin",
        role_id=2,
        balance=Decimal("10000"),
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
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

    # Create 20 additional users
    users_count = 20
    for idx in range(users_count):
        user_id = 3 + idx
        noun = random.choice(noun_pool)
        suffix = random.randint(100, 999)
        username = f"seed_{noun}_{suffix}"
        uid = f"seed-user-{user_id}-{suffix}"
        balance = Decimal("0") # Decimal(str(random.randint(100, 5000)))

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
    r = await session.execute(select(User.id).where(User.role_id == 1))
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
        "based on publicly verifiable data sources selected by moderators.\n"
        "If no conclusive evidence is available by the end date, the market resolves to NO. "
        "Resolution notes must include source links and timestamp context."
    )

    market_count = 50
    market_first_id = 100000
    used_slugs: set[str] = set()
    for idx in range(market_count):
        market_id = market_first_id + idx
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

        start_date = (now - timedelta(days=random.randint(1, 30))).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_date = (now + timedelta(days=random.randint(3, 120))).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        yes_price_float = round(random.uniform(0.05, 0.95), 4)
        yes_price = Decimal(f"{yes_price_float:.4f}")
        no_price = (Decimal("1.0000") - yes_price).quantize(Decimal("0.0001"))

        liquidity = Decimal(str(random.randint(5000, 50000)))
        volume = Decimal(str(random.randint(1000, 500000)))

        await _ensure_market(
            session,
            id=market_id,
            question=question,
            slug=slug,
            description="Auto-generated random seed market for local development.",
            icon=f"http://localhost:9002/images/markets/market-{market_id}.png",
            category_id=random.randint(1, 10),
            creator_id=admin_id,
            tier="standard",
            start_date=start_date,
            end_date=end_date,
            liquidity=liquidity,
            volume=volume,
            status="open",
            is_active=True,
            is_closed=False,
            is_archived=False,
            is_resolved=False,
            rules=rule_template,
            created_at=now,
            updated_at=now,
        )
        await _ensure_market_token(
            session,
            market_id=market_id,
            outcome="YES",
            token=str(generate_bigint_64()),
            price=yes_price,
        )
        await _ensure_market_token(
            session,
            market_id=market_id,
            outcome="NO",
            token=str(generate_bigint_64()),
            price=no_price,
        )


async def run_seed_suggestions(session: AsyncSession) -> None:
    now: datetime = datetime.now(timezone.utc)
    category_slugs = [
        "politics",
        "sports",
        "crypto",
        "esports",
        "finance",
        "geopolitics",
        "tech",
        "culture",
        "economy",
        "weather",
    ]
    question_templates = [
        "Will {topic} happen before {window}?",
        "Will {topic} close above target by {window}?",
        "Will official data show {topic} by {window}?",
        "Will {topic} exceed forecasts by {window}?",
        "Will {topic} milestone be reached before {window}?",
    ]
    topics = [
        "BTC above $120k",
        "ETH staking ratio at new high",
        "US CPI under 2.5%",
        "Pi ecosystem app count over 5,000",
        "major AI model launch",
        "KOSPI yearly gain over 8%",
        "World Cup qualifier upset",
        "global oil price under $70",
        "typhoon landfall in Korea",
        "next flagship smartphone release",
    ]
    windows = [
        "Q3 2026",
        "Q4 2026",
        "year-end 2026",
        "the next 90 days",
        "the next 120 days",
    ]

    suggestion_count = 20
    suggestion_first_id = 1
    for idx in range(suggestion_count):
        suggestion_id = suggestion_first_id + idx
        start_date = (now + timedelta(days=random.randint(1, 15))).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_date = (start_date + timedelta(days=random.randint(20, 90))).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        question = random.choice(question_templates).format(
            topic=random.choice(topics),
            window=random.choice(windows),
        )

        await _ensure_suggestion(
            session,
            id=suggestion_id,
            user_id=random.randint(3, 22),
            question=question,
            description="Seed suggestion for admin review flow validation.",
            category=random.choice(category_slugs),
            start_date=start_date,
            end_date=end_date,
            status="pending",
            reject_reason=None,
            reviewed_by=None,
            reviewed_at=None,
            created_at=now,
            updated_at=now,
        )


async def run_seed_market_trades(session: AsyncSession) -> None:
    token_rows = await session.execute(
        select(
            MarketToken.market_id,
            MarketToken.outcome,
            MarketToken.token,
            MarketToken.price,
        )
    )
    market_token_map: dict[int, dict[str, tuple[str, Decimal]]] = defaultdict(dict)
    for market_id, outcome, token, price in token_rows.all():
        market_token_map[market_id][outcome] = (token, price if price is not None else Decimal("0.5000"))
    markets = [
        (
            market_id,
            token_map["YES"][0],
            token_map["NO"][0],
            token_map["YES"][1],
            token_map["NO"][1],
        )
        for market_id, token_map in market_token_map.items()
        if "YES" in token_map and "NO" in token_map
    ]
    if not markets:
        print("No seeded markets found for trade seeding")
        return

    user_rows = await session.execute(select(User.id))
    user_ids = [user_id for (user_id,) in user_rows.all()]
    if not user_ids:
        print("No seeded users found for trade seeding")
        return

    now: datetime = datetime.now(timezone.utc)
    fee_rate = Decimal("0.02")
    min_price = Decimal("0.0100")
    max_price = Decimal("0.9900")
    price_step = Decimal("0.0001")

    trade_count = random.randint(500, 1000)
    for _ in range(trade_count):
        market_id, token_yes, token_no, yes_base_price, no_base_price = random.choice(markets)
        outcome = random.choice(["YES", "NO"])
        token = token_yes if outcome == "YES" else token_no
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
            token=token,
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
        select(MarketToken.market_id, MarketToken.outcome, MarketToken.token).where(
            MarketToken.market_id.in_(market_ids)
        )
    )
    market_token_map: dict[int, dict[str, str]] = defaultdict(dict)
    for market_id, outcome, token in market_result.all():
        market_token_map[market_id][outcome] = token

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
        token = market_token_map[market_id][outcome]
        if token is None:
            continue

        await _ensure_market_price_candle(
            session,
            market_id=market_id,
            token=token,
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
            "shares": Decimal("0"),
            "pi_amount": Decimal("0"),
        }
    )
    for user_id, market_id, token, side, outcome, shares, pi_amount in trades:
        key = (market_id, user_id, outcome)
        stats[key]["token"] = token
        stats[key]["side"] = side
        stats[key]["shares"] += shares
        stats[key]["pi_amount"] += pi_amount
    return stats


async def run_seed_market_positions(session: AsyncSession) -> None:
    trades_result = await session.execute(
        select(
            MarketTrade.taker_user_id,
            MarketTrade.market_id,
            MarketTrade.token,
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

    for (market_id, user_id, outcome), stat in sorted(position_stats.items()):
        token = stat["token"]
        side = stat["side"]
        shares = max(stat["shares"], Decimal("0")).quantize(quant)
        pi_amount = max(stat["pi_amount"], Decimal("0")).quantize(quant)
        avg_price = (pi_amount / shares).quantize(quant) if shares > 0 else Decimal("0.0000")

        await _ensure_market_position(
            session,
            market_id=market_id,
            user_id=user_id,
            token=token,
            side=side,
            outcome=outcome,
            shares=shares,
            pi_amount=pi_amount,
            avg_price=avg_price,
            final_price=None,
            is_claimed=False,
            created_at=now,
            updated_at=now,
        )


async def run_seed_volume_agg_state(session: AsyncSession) -> None:
    await _ensure_volume_agg_state(
        session,
        id=1,
        last_trade_id=0,
        last_volume_1m_id=0,
    )




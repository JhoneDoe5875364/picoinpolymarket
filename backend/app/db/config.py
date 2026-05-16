import os
from decimal import Decimal
from typing import Optional
from urllib.parse import quote


def _dsn_from_pg_env() -> Optional[str]:
    """
    Build ``postgresql://...`` from ``PGHOST``, ``PGPORT``, ``PGDATABASE``,
    ``PGUSER``, ``PGPASSWORD``, and optional ``PGSSLMODE`` (query param).
    Used when ``DATABASE_URL`` and similar URL env vars are unset.
    """
    host = (os.getenv("PGHOST") or "").strip()
    database = (os.getenv("PGDATABASE") or "").strip()
    user = (os.getenv("PGUSER") or "").strip()
    if not host or not database or not user:
        return None
    port = (os.getenv("PGPORT") or "5432").strip()
    password = os.getenv("PGPASSWORD")
    if password is None:
        password = ""
    user_enc = quote(user, safe="")
    pass_enc = quote(password, safe="")
    db_enc = quote(database, safe="")
    base = f"postgresql://{user_enc}:{pass_enc}@{host}:{port}/{db_enc}"
    sslmode = (os.getenv("PGSSLMODE") or "").strip()
    if sslmode:
        base += f"?sslmode={quote(sslmode, safe='')}"
    return base


def _first_url(*candidates: Optional[str]) -> Optional[str]:
    for c in candidates:
        if c and str(c).strip():
            return str(c).strip()
    return None


DATABASE_URL: Optional[str] = _first_url(
    os.getenv("DATABASE_URL"),
    os.getenv("POSTGRES_URL"),
    os.getenv("SUPABASE_DB_URL"),
    _dsn_from_pg_env(),
)


SEED_OUTCOME_YES = "YES"
SEED_OUTCOME_NO = "NO"
SEED_OUTCOMES: tuple[str, str] = (SEED_OUTCOME_YES, SEED_OUTCOME_NO)

SEED_DECIMAL_ZERO = Decimal("0")
SEED_DECIMAL_QUANT = Decimal("0.0001")
SEED_DECIMAL_ZERO_QUANT = Decimal("0.0000")

SEED_CATEGORY_ROWS: tuple[tuple[int, str, str], ...] = (
    (1, "politics", "Politics"),
    (2, "sports", "Sports"),
    (3, "crypto", "Crypto"),
    (4, "esports", "Esports"),
    (5, "finance", "Finance"),
    (6, "geopolitics", "Geopolitics"),
    (7, "tech", "Tech"),
    (8, "culture", "Culture"),
    (9, "economy", "Economy"),
    (10, "weather", "Weather"),
)

SEED_ADMIN_USERS: tuple[tuple[int, str, str, int], ...] = (
    (1, "superadmin", "superadmin", 1),
    (2, "admin", "admin", 2),
)
SEED_INITIAL_USER_BALANCE = Decimal("10000")
SEED_USER_COUNT = 20
SEED_USER_FIRST_ID = 3
SEED_USER_ROLE_ID = 3
SEED_USER_NOUN_POOL: tuple[str, ...] = (
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
)
SEED_USER_STATUS_POOL: tuple[str, ...] = ("ACTIVE", "ACTIVE", "ACTIVE", "SUSPENDED")
SEED_USER_DEFAULT_STATUS = "ACTIVE"
SEED_USER_DEFAULT_BALANCE = Decimal("0")
SEED_USER_SUFFIX_MIN = 100
SEED_USER_SUFFIX_MAX = 999

SEED_MARKET_COUNT = 20
SEED_MARKET_FIRST_ID = 100000
SEED_MARKET_SUBJECTS: tuple[str, ...] = (
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
)
SEED_MARKET_PREDICATES: tuple[str, ...] = (
    "close above",
    "stay below",
    "reach at least",
    "finish the month over",
    "record more than",
    "announce at least",
    "end with",
    "beat expectations by",
)
SEED_MARKET_TARGETS: tuple[str, ...] = (
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
)
SEED_MARKET_PERIODS: tuple[str, ...] = (
    "this week",
    "this month",
    "by quarter end",
    "before year end",
    "within 30 days",
    "within 60 days",
    "before the next release cycle",
)
SEED_MARKET_RULE_TEMPLATE = (
    "This market resolves to YES only if the exact question condition is met within the specified market window "
    "based on publicly verifiable data sources selected by moderators.\n"
    "If no conclusive evidence is available by the end date, the market resolves to NO. "
    "Resolution notes must include source links and timestamp context."
)
SEED_MARKET_DESCRIPTION = "Auto-generated random seed market for local development."
SEED_MARKET_ICON_TEMPLATE = "http://localhost:9002/images/markets/market-{market_id}.png"
SEED_MARKET_START_MIN_DAYS_AGO = 1
SEED_MARKET_START_MAX_DAYS_AGO = 30
SEED_MARKET_END_MIN_DAYS_AHEAD = 3
SEED_MARKET_END_MAX_DAYS_AHEAD = 120
SEED_MARKET_LIQUIDITY_MIN = 5000
SEED_MARKET_LIQUIDITY_MAX = 50000
SEED_MARKET_DEFAULT_PRICE = Decimal("0.5")
SEED_MARKET_DEFAULT_VOLUME = Decimal("0")
SEED_MARKET_TIER = "standard"
SEED_MARKET_STATUS = "open"
SEED_MARKET_MIN_CATEGORY_ID = 1
SEED_MARKET_MAX_CATEGORY_ID = 10

SEED_SUGGESTION_COUNT = 20
SEED_SUGGESTION_FIRST_ID = 1
SEED_SUGGESTION_USER_MIN_ID = 3
SEED_SUGGESTION_USER_MAX_ID = 22
SEED_SUGGESTION_START_MIN_DAYS_AHEAD = 1
SEED_SUGGESTION_START_MAX_DAYS_AHEAD = 15
SEED_SUGGESTION_DURATION_MIN_DAYS = 20
SEED_SUGGESTION_DURATION_MAX_DAYS = 90
SEED_SUGGESTION_DESCRIPTION = "Seed suggestion for admin review flow validation."
SEED_SUGGESTION_STATUS = "pending"
SEED_SUGGESTION_CATEGORY_SLUGS: tuple[str, ...] = tuple(row[1] for row in SEED_CATEGORY_ROWS)
SEED_SUGGESTION_QUESTION_TEMPLATES: tuple[str, ...] = (
    "Will {topic} happen before {window}?",
    "Will {topic} close above target by {window}?",
    "Will official data show {topic} by {window}?",
    "Will {topic} exceed forecasts by {window}?",
    "Will {topic} milestone be reached before {window}?",
)
SEED_SUGGESTION_TOPICS: tuple[str, ...] = (
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
)
SEED_SUGGESTION_WINDOWS: tuple[str, ...] = (
    "Q3 2026",
    "Q4 2026",
    "year-end 2026",
    "the next 90 days",
    "the next 120 days",
)

SEED_TRADE_LOOKBACK_DAYS = 10
SEED_TRADE_COUNT_MIN_PER_DAY = 100
SEED_TRADE_COUNT_MAX_PER_DAY = 200
SEED_TRADE_SECOND_MIN = 0
SEED_TRADE_SECOND_MAX = 86399
SEED_TRADE_SHARES_MIN = 10
SEED_TRADE_SHARES_MAX = 10000

SEED_MARKET_VOLUME_AGG_STATE_ID = 1
SEED_MARKET_VOLUME_AGG_STATE_LAST_TRADE_ID = 0
SEED_MARKET_VOLUME_AGG_STATE_LAST_VOLUME_1M_ID = 0

SEED_COMMENT_ROOT_PER_MARKET_MIN = 3
SEED_COMMENT_ROOT_PER_MARKET_MAX = 8
SEED_COMMENT_REPLY_PER_ROOT_MIN = 1
SEED_COMMENT_REPLY_PER_ROOT_MAX = 5
SEED_COMMENT_BODY_ROOT_TEMPLATES: tuple[str, ...] = (
    "This market probability looks undervalued right now.",
    "Direction is still mixed when looking at current data.",
    "Volume is rising here, so volatility risk is high.",
    "Risk and reward profile looks favorable to me.",
    "If the next headline confirms, probability may reprice quickly.",
)
SEED_COMMENT_BODY_REPLY_TEMPLATES: tuple[str, ...] = (
    "Agreed, recent headlines support this view.",
    "The opposite case exists, but your rationale is strong.",
    "Recent trade prints match your short-term bias.",
    "There are still variables, but the scenario is reasonable.",
    "I am positioned in a similar direction.",
)

SEED_TABLES: tuple[str, ...] = (
    "categories",
    "users",
    "suggestions",
    "markets",
    "market_tokens",
    "market_trades",
    "market_price_candles",
    "market_positions",
    "leaderboards",
    "comments",
)

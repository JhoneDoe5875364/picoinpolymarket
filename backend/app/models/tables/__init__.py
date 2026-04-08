"""
SQLAlchemy ORM mappings for application tables (1:1 with PostgreSQL tables).
Views (v_*) are queried via repositories using Core/text, not ORM classes.
"""

from app.models.tables.category import Category
from app.models.tables.market import Market
from app.models.tables.market_trades import MarketTrade
from app.models.tables.market_price_candles import MarketPriceCandle
from app.models.tables.user import User

__all__ = [
    "Category",
    "Market",
    "User",
    "MarketTrade",
    "MarketPriceCandle",
]

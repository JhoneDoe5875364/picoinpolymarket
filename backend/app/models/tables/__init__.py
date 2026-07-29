"""
SQLAlchemy ORM mappings for application tables (1:1 with PostgreSQL tables).
Views (v_*) are queried via repositories using Core/text, not ORM classes.
"""

from app.models.tables.category import Category
from app.models.tables.comment import Comment
from app.models.tables.comment_like import CommentLike
from app.models.tables.comment_stat import CommentStat
from app.models.tables.leaderboard import Leaderboard
from app.models.tables.market import Market
from app.models.tables.market_stats import MarketStat
from app.models.tables.market_volume_daily import MarketVolumeDaily
from app.models.tables.market_volume_minute import MarketVolumeMinute
from app.models.tables.market_volume_agg_state import MarketVolumeAggState
from app.models.tables.market_token import MarketToken
from app.models.tables.market_position import MarketPosition
from app.models.tables.market_trades import MarketTrade
from app.models.tables.market_watchlist import MarketWatchlist
from app.models.tables.market_price_candles import MarketPriceCandle
from app.models.tables.order import Order
from app.models.tables.payment import Payment
from app.models.tables.sell_settlement import SellSettlement
from app.models.tables.suggestion import Suggestion
from app.models.tables.user import User

__all__ = [
    "Category",
    "Comment",
    "CommentLike",
    "CommentStat",
    "Leaderboard",
    "Market",
    "MarketStat",
    "MarketToken",
    "MarketVolumeDaily",
    "MarketVolumeMinute",
    "MarketVolumeAggState",
    "User",
    "Order",
    "Payment",
    "SellSettlement",
    "Suggestion",
    "MarketPosition",
    "MarketTrade",
    "MarketPriceCandle",
    "MarketWatchlist",
]

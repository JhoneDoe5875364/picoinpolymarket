"""
SQLAlchemy ORM mappings for application tables (1:1 with PostgreSQL tables).
Views (v_*) are queried via repositories using Core/text, not ORM classes.
"""

from app.models.tables.attestation import AttestationRow
from app.models.tables.category import Category
from app.models.tables.compliance_log import ComplianceLogRow
from app.models.tables.market import Market
from app.models.tables.market_price_history import MarketPriceHistoryRow
from app.models.tables.position import Position
from app.models.tables.suggestion import Suggestion
from app.models.tables.trade import Trade
from app.models.tables.transaction import Transaction
from app.models.tables.user import User

__all__ = [
    "AttestationRow",
    "Category",
    "ComplianceLogRow",
    "Market",
    "MarketPriceHistoryRow",
    "Position",
    "Suggestion",
    "Trade",
    "Transaction",
    "User",
]

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketWatchlist(Base):
    __tablename__ = "market_watchlist"
    __table_args__ = (
        PrimaryKeyConstraint("user_id", "market_id", name="pk_market_watchlist"),
        Index("ix_market_watchlist_user_id", "user_id"),
        Index("ix_market_watchlist_market_id", "market_id"),
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    market_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("markets.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

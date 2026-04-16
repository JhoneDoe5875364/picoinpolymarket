from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Identity, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketPosition(Base):
    __tablename__ = "market_positions"
    __table_args__ = (
        Index("ix_market_positions_market_user", "market_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), primary_key=True)
    market_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    yes_token_id: Mapped[str] = mapped_column(String(255), nullable=False)
    no_token_id: Mapped[str] = mapped_column(String(255), nullable=False)
    yes_shares: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    no_shares: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    avg_price_yes: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    avg_price_no: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

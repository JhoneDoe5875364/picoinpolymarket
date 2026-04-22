from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, Identity, Index, Numeric, String
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
    side: Mapped[str] = mapped_column(String(255), nullable=False)
    outcome: Mapped[str] = mapped_column(String(255), nullable=False)
    token: Mapped[str] = mapped_column(String(255), nullable=False)
    shares: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    pi_amount: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    avg_price: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    final_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(24, 4))
    is_claimed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Identity, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketHolder(Base):
    __tablename__ = "market_holders"
    __table_args__ = (
        Index("ix_market_holders_market_token", "market_id", "token_id"),
        Index("ix_market_holders_market_user", "market_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), primary_key=True)
    market_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    token_id: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

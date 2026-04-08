from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import BigInteger, Date, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketPriceHistoryRow(Base):
    __tablename__ = "market_price_history"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    market_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False
    )
    ts_date: Mapped[date] = mapped_column(Date)
    yes_pct: Mapped[float] = mapped_column(Numeric(12, 6))
    no_pct: Mapped[float] = mapped_column(Numeric(12, 6))
    volume_pi: Mapped[Decimal] = mapped_column(Numeric(24, 8), default=Decimal("0"))

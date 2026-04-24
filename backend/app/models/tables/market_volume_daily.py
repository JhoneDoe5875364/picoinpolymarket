from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, Date, DateTime, Integer, Numeric, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketVolumeDaily(Base):
    __tablename__ = "market_volume_1d"

    market_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    day: Mapped[date] = mapped_column(Date, primary_key=True)

    volume: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    trade_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), server_default=text("now()"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), server_default=text("now()"))

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, Identity, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketVolumeMinute(Base):
    __tablename__ = "market_volume_1m"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), nullable=False, unique=True)
    market_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    bucket_ts: Mapped[datetime] = mapped_column(DateTime(timezone=False), primary_key=True)

    volume: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    trade_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

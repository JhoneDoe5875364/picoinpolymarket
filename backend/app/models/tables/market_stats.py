from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Integer, Numeric, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketStat(Base):
    __tablename__ = "market_stats"

    market_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    volume_24h: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    volume_1w: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    volume_1m: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    volume_total: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False, default=Decimal("0"))

    trade_count_24h: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    trade_count_total: Mapped[Optional[int]] = mapped_column(BigInteger, default=0)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), nullable=False, server_default=text("now()")
    )

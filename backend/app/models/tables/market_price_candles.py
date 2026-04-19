"""OHLCV candles per outcome token; partitioned monthly on ``ts`` (PostgreSQL RANGE).

Inserts require a monthly child partition, e.g.::

    CREATE TABLE market_price_candles_y2026m04 PARTITION OF market_price_candles
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketPriceCandle(Base):
    """Candle row; PK is ``(token_id, ts)``. Table is RANGE-partitioned on ``ts``."""

    __tablename__ = "market_price_candles"
    __table_args__ = {"postgresql_partition_by": "RANGE (ts)"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    market_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    ts: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    open_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    high_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    low_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    close_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    volume: Mapped[Optional[Decimal]] = mapped_column(Numeric(24, 4))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

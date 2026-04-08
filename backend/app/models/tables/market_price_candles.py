"""OHLCV candles per outcome token; partitioned monthly on ``ts`` (PostgreSQL RANGE).

Inserts require a monthly child partition, e.g.::

    CREATE TABLE market_price_candles_y2026m04 PARTITION OF market_price_candles
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketPriceCandle(Base):
    """Candle row; PK is ``(token_id, interval, ts)``. Table is RANGE-partitioned on ``ts``."""

    __tablename__ = "market_price_candles"
    __table_args__ = {"postgresql_partition_by": "RANGE (ts)"}

    token_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    bucket_interval: Mapped[str] = mapped_column("interval", String(10), primary_key=True, quote=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)

    open_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    high_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    low_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    close_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    volume: Mapped[Optional[Decimal]] = mapped_column(Numeric(24, 4))

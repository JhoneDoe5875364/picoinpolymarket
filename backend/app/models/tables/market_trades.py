"""CLOB / order-book style fills; partitioned monthly on ``created_at`` (PostgreSQL RANGE).

``id`` is a bigint identity. Because a unique key must include the partition key,
the primary key is ``(id, created_at)`` (Postgres rule for partitioned tables).

Monthly child partitions are required before insert, e.g.::

    CREATE TABLE market_trades_y2026m04 PARTITION OF market_trades
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Enum, Identity, Index, Numeric, String
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketTrade(Base):
    __tablename__ = "market_trades"
    __table_args__ = (
        Index("ix_market_trades_token_time", "token", "created_at"),
        Index("ix_market_trades_market_time", "market_id", "created_at"),
        Index("ix_market_trades_taker_time", "taker_user_id", "created_at"),
        {"postgresql_partition_by": "RANGE (created_at)"},
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True, precision=6), primary_key=True, nullable=False
    )

    token: Mapped[str] = mapped_column(String(255), nullable=False)
    market_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    taker_user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    maker_user_id: Mapped[int] = mapped_column(BigInteger, nullable=True)

    side: Mapped[str] = mapped_column(
        Enum("BUY", "SELL", name="market_trade_side", create_constraint=True),
        nullable=False,
    )
    outcome: Mapped[str] = mapped_column(
        Enum("YES", "NO", name="market_trade_outcome_side", create_constraint=True),
        nullable=False,
    )

    price: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    shares: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    pi_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    pi_fee: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    pi_total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)

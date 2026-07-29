from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Identity, Index, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SellSettlement(Base):
    """Ledger for user-initiated sells settled via A2U payout.

    One row per sell request. ``sell_request_id`` is client-generated and UNIQUE
    so a retried request never triggers a second on-chain payout (idempotency).
    A row also survives the "Pi sent but DB settle failed" window as PENDING with
    a recorded ``payout_txid``, so it can be reconciled/recovered later.
    """

    __tablename__ = "sell_settlements"
    __table_args__ = (
        Index("ix_sell_settlements_user", "user_id"),
        Index("ix_sell_settlements_position", "position_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), primary_key=True)

    # Client-generated idempotency key (UUID). UNIQUE guards against double-sell.
    sell_request_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    order_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("orders.id"))
    position_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    market_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    outcome: Mapped[str] = mapped_column(String(8), nullable=False)

    sell_shares: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    net_payout: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)

    status: Mapped[str] = mapped_column(
        Enum(
            "PENDING",
            "SETTLED",
            "FAILED",
            name="sell_settlement_status",
            create_constraint=True,
        ),
        nullable=False,
    )

    payout_txid: Mapped[Optional[str]] = mapped_column(Text)
    failure_reason: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, Enum, Identity, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    market_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    token_id: Mapped[str] = mapped_column(String)

    side: Mapped[str] = mapped_column(
        Enum("BUY", "SELL", name="order_side", create_constraint=True),
        nullable=False,
    )
    outcome: Mapped[str] = mapped_column(
        Enum("YES", "NO", name="order_outcome", create_constraint=True),
        nullable=False,
    )

    price: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    size: Mapped[Decimal] = mapped_column(Numeric(24, 2), nullable=False)
    pi_amount: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)

    status: Mapped[str] = mapped_column(
        Enum(
            "PENDING",
            "EXECUTED",
            "FAILED",
            "CANCELLED",
            name="order_status",
            create_constraint=True,
        ),
        nullable=False,
    )

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

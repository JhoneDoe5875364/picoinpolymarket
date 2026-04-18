from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Identity, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), primary_key=True)
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    amount: Mapped[Decimal] = mapped_column(Numeric(24, 4), nullable=False)
    currency: Mapped[Optional[str]] = mapped_column(String, default="PI")

    status: Mapped[str] = mapped_column(
        Enum(
            "PENDING",
            "APPROVED",
            "COMPLETED",
            "FAILED",
            "CANCELLED",
            name="payment_status",
            create_constraint=True,
        ),
        nullable=False,
    )

    pi_payment_id: Mapped[Optional[str]] = mapped_column(Text)
    txid: Mapped[Optional[str]] = mapped_column(Text)
    raw_payload: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)

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

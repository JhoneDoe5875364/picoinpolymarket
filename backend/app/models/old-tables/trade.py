from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL")
    )
    market_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("markets.id", ondelete="SET NULL")
    )
    type: Mapped[Optional[str]] = mapped_column(String)
    side: Mapped[Optional[str]] = mapped_column(String)
    pi_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(24, 8))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    fee_pi: Mapped[Decimal] = mapped_column(Numeric(24, 8), default=Decimal("0"))
    invalid: Mapped[bool] = mapped_column(Boolean, default=False)
    kind: Mapped[str] = mapped_column(String, default="buy")
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(24, 8))

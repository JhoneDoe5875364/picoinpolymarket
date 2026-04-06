from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, List, Optional

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Identity, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.tables.category import Category


class Market(Base):
    __tablename__ = "markets"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    market_no: Mapped[int] = mapped_column(BigInteger, Identity(start=1, increment=1), unique=True, nullable=False)
    question: Mapped[str] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    icon: Mapped[Optional[str]] = mapped_column(String)
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    creator_id: Mapped[Optional[uuid.UUID]] = mapped_column(PGUUID(as_uuid=True))
    tier: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="open")
    outcome_price_yes: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 3), default=Decimal("0"))
    outcome_price_no: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 3), default=Decimal("0"))
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    closed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    liquidity: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 4))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    volume: Mapped[Decimal] = mapped_column(Numeric(24, 8), default=Decimal("0"))
    rules: Mapped[Optional[str]] = mapped_column(Text)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    resolved_outcome: Mapped[Optional[str]] = mapped_column(String)
    resolved_by_user_id: Mapped[Optional[str]] = mapped_column(String)
    resolved_by_username: Mapped[Optional[str]] = mapped_column(String)
    resolution_source: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="markets")

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Enum, ForeignKey, Identity, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.tables.market import Market


class MarketToken(Base):
    __tablename__ = "market_tokens"
    __table_args__ = (
        UniqueConstraint("market_id", "outcome", name="uq_market_tokens_market_outcome"),
        UniqueConstraint("token", name="uq_market_tokens_token"),
        Index("ix_market_tokens_market_id", "market_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), primary_key=True)
    market_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("markets.id", ondelete="CASCADE"),
        nullable=False,
    )
    outcome: Mapped[str] = mapped_column(
        Enum("YES", "NO", name="market_token_outcome", create_constraint=True),
        nullable=False,
    )
    token: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False, default=Decimal("0"))

    market: Mapped["Market"] = relationship("Market", back_populates="market_tokens")

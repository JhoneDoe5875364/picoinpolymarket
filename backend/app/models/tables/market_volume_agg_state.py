from __future__ import annotations

from sqlalchemy import BigInteger, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MarketVolumeAggState(Base):
    __tablename__ = "market_volume_agg_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    last_trade_id: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    last_volume_1m_id: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

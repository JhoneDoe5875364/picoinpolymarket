from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Leaderboard(Base):
    __tablename__ = "leaderboards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    time_bucket: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    pi_user_id: Mapped[Optional[str]] = mapped_column(String(255))
    pi_username: Mapped[Optional[str]] = mapped_column(String(255))
    wallet_address: Mapped[Optional[str]] = mapped_column(String(255))
    vol: Mapped[Optional[Decimal]] = mapped_column(Numeric(24, 4))
    pnl: Mapped[Optional[Decimal]] = mapped_column(Numeric(24, 4))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

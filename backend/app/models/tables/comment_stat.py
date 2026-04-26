from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Integer, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CommentStat(Base):
    __tablename__ = "comment_stats"
    __table_args__ = (
        PrimaryKeyConstraint("market_id", name="pk_comment_stats_market_id"),
    )

    market_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    root_comment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reply_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_commented_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

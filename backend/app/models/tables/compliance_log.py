from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ComplianceLogRow(Base):
    __tablename__ = "compliance_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(255))
    ip: Mapped[str] = mapped_column(String(45))
    region_code: Mapped[str] = mapped_column(String(10))
    state_code: Mapped[Optional[str]] = mapped_column(String(10))
    tier: Mapped[str] = mapped_column(String(50))
    category_key: Mapped[Optional[str]] = mapped_column(String(255))
    action_type: Mapped[str] = mapped_column(String(100))
    result: Mapped[str] = mapped_column(String(50))
    reason: Mapped[Optional[str]] = mapped_column(Text)
    timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

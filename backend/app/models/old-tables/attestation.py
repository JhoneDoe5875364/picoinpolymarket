from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AttestationRow(Base):
    __tablename__ = "attestations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255))
    ip: Mapped[str] = mapped_column(String(45))
    region_code: Mapped[str] = mapped_column(String(10))
    state_code: Mapped[Optional[str]] = mapped_column(String(10))
    attestation_version: Mapped[str] = mapped_column(String(20))
    timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

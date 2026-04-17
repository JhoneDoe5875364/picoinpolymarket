from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, Identity, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=False), primary_key=True)
    pi_uid: Mapped[Optional[str]] = mapped_column(String, unique=True)
    pi_username: Mapped[Optional[str]] = mapped_column(String)
    role_id: Mapped[int] = mapped_column(Integer, default=3)
    balance: Mapped[Decimal] = mapped_column(Numeric(24, 4), default=Decimal("0"))
    status: Mapped[Optional[str]] = mapped_column(
        Enum(
            "ACTIVE",
            "SUSPENDED",
            "BANNED",
            name="user_status",
            create_constraint=True,
        ),
        default="ACTIVE",
    )
    referral_code: Mapped[Optional[str]] = mapped_column(String)
    referred_by: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

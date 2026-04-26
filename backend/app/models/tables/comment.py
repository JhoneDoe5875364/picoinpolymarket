from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (
        CheckConstraint("depth in (0, 1)", name="ck_comments_depth_range"),
        Index(
            "ix_comments_market_root_created",
            "market_id",
            "depth",
            "created_at",
            "id",
        ),
        Index(
            "ix_comments_root_depth_created",
            "root_comment_id",
            "depth",
            "created_at",
            "id",
        ),
        Index(
            "ix_comments_parent_created",
            "parent_comment_id",
            "created_at",
            "id",
        ),
        Index("ix_comments_player_created", "player_id", "created_at"),
        {"postgresql_partition_by": "RANGE (created_at)"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True, precision=6),
        primary_key=True,
        nullable=False,
    )

    market_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("markets.id", ondelete="CASCADE"),
        nullable=False,
    )
    player_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_comment_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    root_comment_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    depth: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(
            "active",
            "deleted",
            "blocked",
            name="comment_status",
            create_constraint=True,
        ),
        nullable=False,
        default="active",
    )
    reply_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

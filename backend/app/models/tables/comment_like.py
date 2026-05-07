from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CommentLike(Base):
    __tablename__ = "comment_likes"
    __table_args__ = (
        PrimaryKeyConstraint("comment_id", "user_id", name="pk_comment_likes"),
        Index("ix_comment_likes_comment_id", "comment_id"),
        Index("ix_comment_likes_user_id", "user_id"),
    )

    comment_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

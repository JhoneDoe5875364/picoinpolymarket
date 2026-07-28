"""add wallet_address to users

Users enter their own payout destination; Pi login never provides a wallet
address. Stored on users (not leaderboards, which the updater rebuilds and would
overwrite with NULL).

Revision ID: d4e8a1b2c3f5
Revises: c1f4a7d92b30
Create Date: 2026-07-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e8a1b2c3f5"
down_revision: Union[str, Sequence[str], None] = "c1f4a7d92b30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("wallet_address", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("wallet_updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "wallet_updated_at")
    op.drop_column("users", "wallet_address")

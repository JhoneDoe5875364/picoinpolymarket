"""add pari-mutuel escrow columns to markets

Escrow accounting so winner payouts are funded by the market's own pool
(loser + winner principal) instead of the app wallet. See
docs/feedbacks/20260729_V6_Escrow_Accounting_Design.ko.md.

Revision ID: b7e2c4f918a3
Revises: a4c82f1e9b7d
Create Date: 2026-07-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7e2c4f918a3"
down_revision: Union[str, Sequence[str], None] = "a4c82f1e9b7d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "markets",
        sa.Column("escrow_pool", sa.Numeric(24, 4), nullable=False, server_default="0"),
    )
    op.add_column(
        "markets",
        sa.Column("gross_staked", sa.Numeric(24, 4), nullable=False, server_default="0"),
    )
    op.add_column(
        "markets",
        sa.Column("gross_paid_out", sa.Numeric(24, 4), nullable=False, server_default="0"),
    )
    op.add_column("markets", sa.Column("pool_at_resolution", sa.Numeric(24, 4), nullable=True))
    op.add_column("markets", sa.Column("winners_total_shares", sa.Numeric(24, 4), nullable=True))


def downgrade() -> None:
    op.drop_column("markets", "winners_total_shares")
    op.drop_column("markets", "pool_at_resolution")
    op.drop_column("markets", "gross_paid_out")
    op.drop_column("markets", "gross_staked")
    op.drop_column("markets", "escrow_pool")

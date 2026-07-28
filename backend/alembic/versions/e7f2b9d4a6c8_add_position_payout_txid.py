"""add payout_txid to market_positions

Records the on-chain transaction id when a winning position is paid out (A2U
auto-pay or a manual payout with the txid entered), so payouts are auditable.

Revision ID: e7f2b9d4a6c8
Revises: d4e8a1b2c3f5
Create Date: 2026-07-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e7f2b9d4a6c8"
down_revision: Union[str, Sequence[str], None] = "d4e8a1b2c3f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "market_positions",
        sa.Column("payout_txid", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("market_positions", "payout_txid")

"""add PAYING value to sell_settlement_status enum

The sell flow now reduces the position BEFORE sending the A2U payout (to close
the double-spend window), so a settlement whose position is already reduced but
whose payout is still in flight is marked PAYING. Adding an enum value is
idempotent via IF NOT EXISTS.

Revision ID: a4c82f1e9b7d
Revises: f3a91c7d05e2
Create Date: 2026-07-29

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a4c82f1e9b7d"
down_revision: Union[str, Sequence[str], None] = "f3a91c7d05e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction block on older
    # PostgreSQL, and Alembic wraps migrations in one. Use an autocommit block.
    with op.get_context().autocommit_block():
        op.execute(
            "ALTER TYPE sell_settlement_status ADD VALUE IF NOT EXISTS 'PAYING'"
        )


def downgrade() -> None:
    # PostgreSQL cannot drop a single enum value; leaving 'PAYING' in place is
    # harmless. No-op downgrade.
    pass

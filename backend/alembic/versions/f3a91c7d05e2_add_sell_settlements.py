"""add sell_settlements ledger for A2U-settled user sells

Records one row per user-initiated sell. ``sell_request_id`` is a client-generated
idempotency key (UNIQUE) so a retried request cannot trigger a second on-chain
payout. A row also persists the "Pi sent but DB settle failed" window as PENDING
with a recorded payout_txid for later reconciliation.

Revision ID: f3a91c7d05e2
Revises: e7f2b9d4a6c8
Create Date: 2026-07-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f3a91c7d05e2"
down_revision: Union[str, Sequence[str], None] = "e7f2b9d4a6c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    status_enum = sa.Enum(
        "PENDING", "SETTLED", "FAILED", name="sell_settlement_status"
    )
    status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "sell_settlements",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("sell_request_id", sa.String(length=64), nullable=False),
        sa.Column("order_id", sa.BigInteger(), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("position_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("market_id", sa.BigInteger(), nullable=False),
        sa.Column("outcome", sa.String(length=8), nullable=False),
        sa.Column("sell_shares", sa.Numeric(24, 4), nullable=False),
        sa.Column("price", sa.Numeric(24, 4), nullable=False),
        sa.Column("net_payout", sa.Numeric(24, 4), nullable=False),
        sa.Column(
            "status",
            status_enum,
            nullable=False,
        ),
        sa.Column("payout_txid", sa.Text(), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_unique_constraint(
        "uq_sell_settlements_request_id", "sell_settlements", ["sell_request_id"]
    )
    op.create_index("ix_sell_settlements_user", "sell_settlements", ["user_id"])
    op.create_index("ix_sell_settlements_position", "sell_settlements", ["position_id"])


def downgrade() -> None:
    op.drop_index("ix_sell_settlements_position", table_name="sell_settlements")
    op.drop_index("ix_sell_settlements_user", table_name="sell_settlements")
    op.drop_constraint(
        "uq_sell_settlements_request_id", "sell_settlements", type_="unique"
    )
    op.drop_table("sell_settlements")
    sa.Enum(name="sell_settlement_status").drop(op.get_bind(), checkfirst=True)

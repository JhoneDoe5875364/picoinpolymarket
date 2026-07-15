"""unique constraints on payments.pi_payment_id and payments.txid

Prevents replay: a Pi payment (and its on-chain transaction) may back at most one
payment row, so the same payment cannot be spent on a second order. NULLs are not
considered duplicates in Postgres, so rows created before Pi returns an identifier
remain valid.

Revision ID: c1f4a7d92b30
Revises: bb10f88a2cfe
Create Date: 2026-06-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c1f4a7d92b30"
down_revision: Union[str, Sequence[str], None] = "bb10f88a2cfe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "uq_payments_pi_payment_id",
        "payments",
        ["pi_payment_id"],
        unique=True,
        postgresql_where=sa.text("pi_payment_id IS NOT NULL"),
    )
    op.create_index(
        "uq_payments_txid",
        "payments",
        ["txid"],
        unique=True,
        postgresql_where=sa.text("txid IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_payments_txid", table_name="payments")
    op.drop_index("uq_payments_pi_payment_id", table_name="payments")

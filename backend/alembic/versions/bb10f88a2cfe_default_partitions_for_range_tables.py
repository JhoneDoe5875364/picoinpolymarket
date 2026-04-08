"""default_partitions_for_range_tables

PG declarative partitioning: parent tables have no storage until a child partition
exists. DEFAULT partitions accept any row that does not match a specific range/list
partition (handy for dev/seeds). Replace with monthly partitions in production if needed.

Revision ID: bb10f88a2cfe
Revises: 2831c3678741
Create Date: 2026-04-08

"""
from typing import Sequence, Union

from alembic import op

revision: str = "bb10f88a2cfe"
down_revision: Union[str, Sequence[str], None] = "2831c3678741"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $body$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'market_trades_default'
              AND n.nspname = current_schema()
          ) THEN
            EXECUTE
              'CREATE TABLE market_trades_default PARTITION OF market_trades DEFAULT';
          END IF;
        END
        $body$;
        """
    )
    op.execute(
        """
        DO $body$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'market_price_candles_default'
              AND n.nspname = current_schema()
          ) THEN
            EXECUTE
              'CREATE TABLE market_price_candles_default PARTITION OF market_price_candles DEFAULT';
          END IF;
        END
        $body$;
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS market_trades_default")
    op.execute("DROP TABLE IF EXISTS market_price_candles_default")

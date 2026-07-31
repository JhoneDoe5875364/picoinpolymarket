"""Backfill markets.escrow_pool from existing trades/positions.

The escrow pool = principal staked (BUY amounts) minus principal already paid
out (SELL refunds + winner payouts already claimed). For markets created before
the escrow columns existed the pool is 0, so this reconstructs it.

Strategy (per market):
  staked   = Σ market_trades.pi_amount  where side='BUY'   (pi_amount = price*shares)
  sold     = Σ market_trades.pi_total_amount where side='SELL' (net refund paid)
  paid_win = Σ (shares * final_price) for claimed winning positions
  escrow_pool = max(0, staked - sold - paid_win)
  gross_staked = staked ; gross_paid_out = sold + paid_win

Only touches markets whose escrow columns are still all-zero, so it is safe to
re-run. Resolved markets are backfilled too (so any not-yet-claimed winners draw
from a correct pool), but already-claimed payouts are subtracted out.

Run (server, venv):  python bin/backfill_escrow_pool.py [--commit]
"""
from __future__ import annotations

import asyncio
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select, update  # noqa: E402

from app.db.session import create_engine_and_sessionmaker  # noqa: E402
from app.models.tables.market import Market  # noqa: E402
from app.models.tables.market_position import MarketPosition  # noqa: E402
from app.models.tables.market_trades import MarketTrade  # noqa: E402

Q = Decimal("0.0001")


async def main(commit: bool) -> None:
    _engine, session_maker = create_engine_and_sessionmaker()
    async with session_maker() as s:
        market_ids = (await s.execute(select(Market.id))).scalars().all()
        print(f"markets: {len(market_ids)}")
        changed = 0
        for mid in market_ids:
            # skip markets that already have escrow data
            existing = (
                await s.execute(
                    select(Market.escrow_pool, Market.gross_staked, Market.gross_paid_out).where(Market.id == mid)
                )
            ).one()
            if any(Decimal(str(v or 0)) != 0 for v in existing):
                continue

            staked = Decimal(str((await s.execute(
                select(func.coalesce(func.sum(MarketTrade.pi_amount), 0)).where(
                    MarketTrade.market_id == mid, MarketTrade.side == "BUY"
                )
            )).scalar_one() or 0))
            sold = Decimal(str((await s.execute(
                select(func.coalesce(func.sum(MarketTrade.pi_total_amount), 0)).where(
                    MarketTrade.market_id == mid, MarketTrade.side == "SELL"
                )
            )).scalar_one() or 0))
            paid_win = Decimal(str((await s.execute(
                select(func.coalesce(func.sum(MarketPosition.shares * MarketPosition.final_price), 0)).where(
                    MarketPosition.market_id == mid,
                    MarketPosition.is_claimed == True,
                    MarketPosition.final_price > 0,
                )
            )).scalar_one() or 0))

            pool = (staked - sold - paid_win).quantize(Q)
            if pool < 0:
                pool = Decimal("0")
            gross_staked = staked.quantize(Q)
            gross_paid_out = (sold + paid_win).quantize(Q)

            if staked == 0 and sold == 0 and paid_win == 0:
                continue  # nothing to write

            print(f"  market {mid}: staked={staked} sold={sold} paid_win={paid_win} -> pool={pool}")
            if commit:
                await s.execute(
                    update(Market)
                    .where(Market.id == mid)
                    .values(escrow_pool=pool, gross_staked=gross_staked, gross_paid_out=gross_paid_out)
                )
            changed += 1

        if commit:
            await s.commit()
            print(f"COMMITTED. {changed} markets updated.")
        else:
            print(f"DRY RUN. {changed} markets would be updated. Re-run with --commit to apply.")


if __name__ == "__main__":
    asyncio.run(main("--commit" in sys.argv))

'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatPiAmount, toNumber, toPriceLabel, toRelativeTimeLabel } from '@/lib/utils';
import { apiFetchWithToken } from '@/lib/api';
import { TRADE_TERMS } from '@/lib/trade/tradeTerms';

export type TradeRow = {
  id: string;
  marketTitle: string;
  marketImage: string | null;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  price: number;
  shares: number;
  piAmount: number;
  createdAt: string;
};

type ProfileActivityTabProps = {
  isActive: boolean;
};

const PAGE_SIZE = 10;

function normalizeTradeRow(row: any, index: number): TradeRow {
  const side: 'BUY' | 'SELL' = String(row?.side ?? 'BUY') === 'SELL' ? 'SELL' : 'BUY';
  const outcome: 'YES' | 'NO' = String(row?.outcome ?? 'YES') === 'NO' ? 'NO' : 'YES';

  return {
    id: String(row?.id ?? index),
    marketTitle: String(row?.question ?? 'Untitled market'),
    marketImage: row?.icon ?? 'http://localhost:9002/images/markets/market-default.png',
    side,
    outcome,
    price: toNumber(row?.price ?? 0),
    shares: toNumber(row?.shares ?? 0),
    piAmount: toNumber(row?.pi_amount ?? 0),
    createdAt: String(row?.created_at ?? ''),
  };
}

function buildTradesParams(userId: string, offset: number): URLSearchParams {
  return new URLSearchParams({
    user_id: userId,
    limit: String(PAGE_SIZE),
    offset: String(offset),
    order: 'created_at',
    ascending: 'false',
  });
}

async function fetchTradePage(userId: string, offset: number): Promise<any[]> {
  const params = buildTradesParams(userId, offset);
  const res = await apiFetchWithToken<any>(`/users/trades?${params.toString()}`, {
    method: 'GET',
  });
  return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}

function normalizeTradePage(rows: any[], startIndex: number): TradeRow[] {
  return rows.map((row, index) => normalizeTradeRow(row, startIndex + index));
}



export function ProfileActivityTab({
  isActive,
}: ProfileActivityTabProps) {
  const { ppxUser } = useAuth();
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesLoadingMore, setTradesLoadingMore] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [hasMoreTrades, setHasMoreTrades] = useState(true);
  const tradesNextOffsetRef = useRef(0);
  const tradesLoadMoreInFlightRef = useRef(false);
  const tradesObserverRef = useRef<IntersectionObserver | null>(null);
  const tradesSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;

    async function loadTrades() {
      setTradesLoading(true);
      setTradesError(null);
      setTrades([]);
      setHasMoreTrades(true);
      tradesNextOffsetRef.current = 0;
      try {
        const userId = ppxUser?.id?.toString() ?? '3';
        const rows = await fetchTradePage(userId, 0);
        if (cancelled) return;

        const normalized = normalizeTradePage(rows, 0);
        setTrades(normalized);
        setHasMoreTrades(normalized.length === PAGE_SIZE);
        tradesNextOffsetRef.current = normalized.length;
      } catch (error: any) {
        if (cancelled) return;
        setTrades([]);
        setHasMoreTrades(false);
        setTradesError(error?.message ?? 'Failed to load activity.');
      } finally {
        if (!cancelled) {
          setTradesLoading(false);
        }
      }
    }

    loadTrades();
    return () => {
      cancelled = true;
    };
  }, [ppxUser?.id, isActive]);

  useEffect(() => {
    if (!isActive || tradesLoading || tradesLoadingMore || !hasMoreTrades) return;
    const sentinel = tradesSentinelRef.current;
    if (!sentinel) return;

    tradesObserverRef.current?.disconnect();
    tradesObserverRef.current = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || tradesLoadMoreInFlightRef.current) return;

        tradesLoadMoreInFlightRef.current = true;
        setTradesLoadingMore(true);
        try {
          const userId = ppxUser?.id?.toString() ?? '3';
          const currentOffset = tradesNextOffsetRef.current;
          const rows = await fetchTradePage(userId, currentOffset);
          const normalized = normalizeTradePage(rows, currentOffset);

          setTrades((prev) => [...prev, ...normalized]);
          tradesNextOffsetRef.current += normalized.length;
          setHasMoreTrades(normalized.length === PAGE_SIZE);
        } catch {
          setHasMoreTrades(false);
        } finally {
          tradesLoadMoreInFlightRef.current = false;
          setTradesLoadingMore(false);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    tradesObserverRef.current.observe(sentinel);
    return () => tradesObserverRef.current?.disconnect();
  }, [ppxUser?.id, hasMoreTrades, isActive, tradesLoading, tradesLoadingMore]);

  return (
    <div className="space-y-3">
      {tradesError ? (
        <Card>
          <CardContent>
            <p className="py-6 text-sm text-destructive">{tradesError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="">
            <Table>
              <TableHeader className="hidden md:table-header-group">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-28 uppercase tracking-wide text-xs">Type</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs">Market</TableHead>
                  <TableHead className="w-20 md:w-40 text-right uppercase tracking-wide text-xs">{TRADE_TERMS.amount}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tradesLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={`activity-skeleton-desktop-${index}`}>
                      <TableCell colSpan={3}>
                        <div className="h-11 animate-pulse rounded-md bg-muted/40" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : trades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                      No activity found
                    </TableCell>
                  </TableRow>
                ) : (
                  trades.map((trade, rowIndex) => (
                    <TableRow key={`trade-desktop-${trade.id}-${trade.createdAt}-${rowIndex}`}>
                      <TableCell className="hidden md:block text-sm font-semibold">{trade.side === 'BUY' ? 'Buy' : 'Sell'}</TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            {trade.marketImage ? (
                              <img src={trade.marketImage} alt={trade.marketTitle} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                              {trade.marketTitle}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.5 font-semibold',
                                  trade.outcome === 'NO'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                )}
                              >
                                {trade.outcome === 'NO' ? 'No' : 'Yes'} {toPriceLabel(trade.price)}
                              </span>
                              <span>{trade.shares.toFixed(1)} shares</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="text-sm font-bold leading-none">{formatPiAmount(trade.piAmount)}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {toRelativeTimeLabel(trade.createdAt)}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {hasMoreTrades && !tradesLoading ? (
        <div ref={tradesSentinelRef} className="h-6" aria-hidden="true" />
      ) : null}
      {tradesLoadingMore ? (
        <p className="text-center text-sm text-muted-foreground">Loading more activity...</p>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, roundLocalePi, toNumber, toPercentLabel, toPriceLabel, toSignedMoney } from '@/lib/utils';
import { PositionsToolbar } from '@/components/profile/PositionsToolbar';
import { apiFetchWithToken } from '@/lib/api';
import { TRADE_COPY } from '@/lib/copy/trade';
import { TRADE_TERMS } from '@/lib/trade/tradeTerms';
import SellModal from '@/components/market/SellModal';
import { Button } from '@/components/ui/button';

export type PositionRow = {
  id: string;
  marketId: string | null;
  marketTitle: string;
  marketImage: string | null;
  outcome: 'YES' | 'NO';
  avgPrice: number;
  currentPrice: number;
  shares: number;
  pnl: number;
  pnlPercent: number;
  currentPiAmount: number;
};

const SORT_OPTIONS = [
  TRADE_COPY.netResultLabel,
  'Traded',
  'Alphabetically',
  'Average Price',
  'Current Price',
  'Amount',
] as const;

const PAGE_SIZE = 10;

type ProfilePositionsTabProps = {
  isActive: boolean;
};

function normalizePositionRow(row: any, index: number): PositionRow {
  const outcome: 'YES' | 'NO' = String(row?.outcome ?? 'YES') === 'YES' ? 'YES' : 'NO';
  const avgPrice = toNumber(row?.avg_price ?? 0);
  const currentPrice = toNumber(row?.current_price ?? 0);
  const shares = toNumber(row?.shares ?? 0);
  const pnl = toNumber(row?.pnl ?? 0);
  const pnlPercent = toNumber(row?.pnl_percent ?? 0);
  const currentPiAmount = toNumber(row?.current_pi_amount ?? 0);

  const rawMarketId = row?.market_id;
  return {
    id: String(row?.id ?? index),
    marketId: rawMarketId != null ? String(rawMarketId) : null,
    marketTitle: String(row?.question ?? 'Untitled market'),
    marketImage: row?.icon ?? 'http://localhost:9002/images/markets/market-default.png',
    outcome,
    avgPrice,
    currentPrice,
    shares,
    pnl,
    pnlPercent,
    currentPiAmount,
  };
}

function mapSortOptionToApi(sortBy: (typeof SORT_OPTIONS)[number]): string {
  switch (sortBy) {
    case TRADE_COPY.netResultLabel:
      return 'pnl';
    case 'Traded':
      return 'shares';
    case 'Alphabetically':
      return 'market_title';
    case 'Average Price':
      return 'avg_price';
    case 'Current Price':
      return 'current_price';
    case 'Amount':
      return 'pi_amount';
    default:
      return 'pnl';
  }
}

function buildPositionsParams(args: {
  userId: string;
  positionFilter: 'active' | 'closed';
  search: string;
  offset: number;
  sortBy: (typeof SORT_OPTIONS)[number];
}): URLSearchParams {
  const params = new URLSearchParams({
    user_id: args.userId,
    is_closed: args.positionFilter === 'active' ? 'false' : 'true',
    search: args.search,
    limit: String(PAGE_SIZE),
    offset: String(args.offset),
    order: mapSortOptionToApi(args.sortBy),
    ascending: 'false',
  });
  if (args.search) {
    params.set('search', args.search);
  }
  return params;
}

async function fetchPositionPage(args: {
  userId: string;
  positionFilter: 'active' | 'closed';
  search: string;
  offset: number;
  sortBy: (typeof SORT_OPTIONS)[number];
}): Promise<any[]> {
  const params = buildPositionsParams(args);
  const res = await apiFetchWithToken<any>(`/users/positions?${params.toString()}`, {
    method: 'GET',
  });
  return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}

function normalizePositionPage(rows: any[], startIndex: number): PositionRow[] {
  return rows.map((row, index) => normalizePositionRow(row, startIndex + index));
}

export function ProfilePositionsTab({
  isActive,
}: ProfilePositionsTabProps) {
  const { ppxUser } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>(TRADE_COPY.netResultLabel);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsLoadingMore, setPositionsLoadingMore] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [hasMorePositions, setHasMorePositions] = useState(true);
  const nextOffsetRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sellTarget, setSellTarget] = useState<PositionRow | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;

    async function loadInitialPositions() {
      setPositionsLoading(true);
      setPositionsError(null);
      setPositions([]);
      setHasMorePositions(true);
      nextOffsetRef.current = 0;

      try {
        const userId = ppxUser?.id?.toString() ?? '3';
        const rows = await fetchPositionPage({
          userId,
          positionFilter: status,
          search: debouncedSearch,
          offset: 0,
          sortBy,
        });
        if (cancelled) return;

        const normalized = normalizePositionPage(rows, 0);
        setPositions(normalized);
        setHasMorePositions(normalized.length === PAGE_SIZE);
        nextOffsetRef.current = normalized.length;
      } catch (error: any) {
        if (cancelled) return;
        setHasMorePositions(false);
        setPositionsError(error?.message ?? 'Failed to load positions.');
      } finally {
        if (!cancelled) {
          setPositionsLoading(false);
        }
      }
    }

    loadInitialPositions();

    return () => {
      cancelled = true;
    };
  }, [ppxUser?.id, debouncedSearch, isActive, status, sortBy, reloadKey]);

  useEffect(() => {
    if (!isActive || positionsLoading || positionsLoadingMore || !hasMorePositions) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadMoreInFlightRef.current) return;

        loadMoreInFlightRef.current = true;
        setPositionsLoadingMore(true);
        try {
          const userId = ppxUser?.id?.toString() ?? '3';
          const currentOffset = nextOffsetRef.current;
          const rows = await fetchPositionPage({
            userId,
            positionFilter: status,
            search: debouncedSearch,
            offset: currentOffset,
            sortBy,
          });
          const normalized = normalizePositionPage(rows, currentOffset);

          setPositions((prev) => [...prev, ...normalized]);
          nextOffsetRef.current += normalized.length;
          setHasMorePositions(normalized.length === PAGE_SIZE);
        } catch {
          setHasMorePositions(false);
        } finally {
          loadMoreInFlightRef.current = false;
          setPositionsLoadingMore(false);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [ppxUser?.id, debouncedSearch, hasMorePositions, isActive, status, positionsLoading, positionsLoadingMore, sortBy]);

  return (
    <div className="space-y-3">
      <PositionsToolbar
        status={status}
        onStatusChange={setStatus}
        sortBy={sortBy}
        sortOptions={SORT_OPTIONS}
        onSortChange={(value) => setSortBy(value as (typeof SORT_OPTIONS)[number])}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      {positionsError ? (
        <Card>
          <CardContent>
            <p className="py-6 text-sm text-destructive">{positionsError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="hidden md:table-header-group">
              <TableRow className="hover:bg-transparent">
                <TableHead className="uppercase tracking-wide text-xs">
                  <span className="inline-flex items-center gap-1">Market</span>
                </TableHead>
                <TableHead className="hidden text-right uppercase tracking-wide text-xs sm:table-cell">
                  <span className="inline-flex items-center gap-1">Avg</span>
                </TableHead>
                <TableHead className="hidden text-right uppercase tracking-wide text-xs md:table-cell">
                  Current
                </TableHead>
                <TableHead className="text-right uppercase tracking-wide text-xs">
                  <span className="inline-flex items-center gap-1">{TRADE_COPY.netResultLabel}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell colSpan={4}>
                      <div className="h-12 animate-pulse rounded-md bg-muted/40" />
                    </TableCell>
                  </TableRow>
                ))
              ) : positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No positions found
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((position) => {
                  const pnlClass =
                    position.pnl > 0
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : position.pnl < 0
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-muted-foreground';

                  const goToMarket = position.marketId
                    ? () => router.push(`/markets/${position.marketId}`)
                    : undefined;

                  return (
                    <TableRow
                      key={position.id}
                      onClick={goToMarket}
                      role={goToMarket ? 'link' : undefined}
                      tabIndex={goToMarket ? 0 : undefined}
                      onKeyDown={
                        goToMarket
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                goToMarket();
                              }
                            }
                          : undefined
                      }
                      className={cn(goToMarket && 'cursor-pointer hover:bg-muted/50')}
                    >
                      <TableCell className="min-w-[220px]">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            {position.marketImage ? (
                              <img src={position.marketImage} alt={position.marketTitle} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm md:text-md font-semibold leading-5 text-foreground">
                              {position.marketTitle}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.5 font-semibold',
                                  position.outcome === 'NO'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                )}
                              >
                                {position.outcome === 'NO' ? 'No' : 'Yes'} {toPriceLabel(position.avgPrice)}
                              </span>
                              <span>{position.shares.toFixed(1)} shares</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-right text-sm md:text-md font-semibold sm:table-cell">
                        {toPriceLabel(position.avgPrice)}
                      </TableCell>
                      <TableCell className="hidden text-right text-sm md:text-md font-semibold md:table-cell">
                        {toPriceLabel(position.currentPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="text-sm md:text-md font-bold leading-none">{roundLocalePi(position.currentPiAmount)}</p>
                        {/* <p className="mt-1 text-[11px] text-muted-foreground">{TRADE_TERMS.amount}</p> */}
                        <p className={cn('mt-1 text-xs font-semibold', pnlClass)}>
                          {toSignedMoney(position.pnl)} ({toPercentLabel(position.pnlPercent)})
                        </p>
                        {status === 'active' && position.shares > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSellTarget(position);
                            }}
                          >
                            Sell
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {hasMorePositions && !positionsLoading ? (
        <div ref={sentinelRef} className="h-6" aria-hidden="true" />
      ) : null}
      {positionsLoadingMore ? (
        <p className="text-center text-sm text-muted-foreground">Loading more positions...</p>
      ) : null}

      {sellTarget ? (
        <SellModal
          open={Boolean(sellTarget)}
          positionId={sellTarget.id}
          outcome={sellTarget.outcome}
          marketQuestion={sellTarget.marketTitle}
          currentPrice={sellTarget.currentPrice}
          heldShares={sellTarget.shares}
          onClose={() => setSellTarget(null)}
          onSold={() => {
            setSellTarget(null);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}

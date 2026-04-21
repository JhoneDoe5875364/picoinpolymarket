'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronsUpDown,
  Pencil,
  Search,
  SlidersHorizontal,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiFetchWithToken } from '@/lib/api';

const SORT_OPTIONS = [
  'Profit/Loss',
  'Traded',
  'Alphabetically',
  'Average Price',
  'Current Price',
  'Pi Amount',
] as const;

const PAGE_SIZE = 10;

type PositionRow = {
  id: string;
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

type TradeRow = {
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

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toPercentLabel(value: number): string {
  const normalized = value <= 1 && value >= -1 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
}

function toSignedMoney(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(2)}π`;
}

function toPriceLabel(value: number): string {
  return `${value.toFixed(2)}π`;
}

function toRelativeTimeLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const diffSeconds = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return parsed.toLocaleDateString();
}

function normalizePositionRow(row: any, index: number): PositionRow {
  const outcome: 'YES' | 'NO' = String(row?.outcome ?? 'YES') === 'YES' ? 'YES' : 'NO';
  const avgPrice = toNumber(row?.avg_price ?? 0);
  const currentPrice = toNumber(row?.current_price ?? 0);
  const shares = toNumber(row?.shares ?? 0);
  const pnl = toNumber(row?.pnl ?? 0);
  const pnlPercent = toNumber(row?.pnl_percent ?? 0);
  const currentPiAmount = toNumber(row?.current_pi_amount ?? 0);

  return {
    id: String(row?.id ?? index),
    marketTitle: String(row?.question ?? 'Untitled market'),
    marketImage: row.icon ?? "http://localhost:9002/images/markets/market-default.png",
    outcome,
    avgPrice,
    currentPrice,
    shares,
    pnl,
    pnlPercent,
    currentPiAmount,
  };
}

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

function mapSortOptionToApi(sortBy: (typeof SORT_OPTIONS)[number]): string {
  switch (sortBy) {
    case 'Profit/Loss':
      return 'pnl';
    case 'Traded':
      return 'shares';
    case 'Alphabetically':
      return 'market_title';
    case 'Average Price':
      return 'avg_price';
    case 'Current Price':
      return 'current_price';
    case 'Pi Amount':
      return 'pi_amount';
    default:
      return 'pnl';
  }
}

export default function ProfilePage() {
  const { authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');
  const [positionFilter, setPositionFilter] = useState<'active' | 'closed'>('active');
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>('Profit/Loss');
  const [ascending, setAscending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsLoadingMore, setPositionsLoadingMore] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [hasMorePositions, setHasMorePositions] = useState(true);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesLoadingMore, setTradesLoadingMore] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [hasMoreTrades, setHasMoreTrades] = useState(true);
  const nextOffsetRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const tradesNextOffsetRef = useRef(0);
  const tradesLoadMoreInFlightRef = useRef(false);
  const tradesObserverRef = useRef<IntersectionObserver | null>(null);
  const tradesSentinelRef = useRef<HTMLDivElement | null>(null);

  const profileName = useMemo(() => {
    return (
      authUser?.wallet_address ??
      authUser?.address ??
      authUser?.pi_username ??
      '0x7883590f9f3Dc4...'
    );
  }, [authUser]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab !== 'positions') return;
    let cancelled = false;

    async function loadInitialPositions() {
      setPositionsLoading(true);
      setPositionsError(null);
      setPositions([]);
      setHasMorePositions(true);
      nextOffsetRef.current = 0;

      try {
        const params = new URLSearchParams({
          user_id: authUser?.id.toString() ?? '3',
          status: positionFilter === 'active' ? 'OPEN' : 'CLOSED',
          search: debouncedSearch,
          limit: String(PAGE_SIZE),
          offset: '0',
          order: mapSortOptionToApi(sortBy),
          ascending: ascending ? 'true' : 'false',
        });
        if (debouncedSearch) {
          params.set('search', debouncedSearch);
        }

        const res = await apiFetchWithToken<any>(`/users/positions?${params.toString()}`, {
          method: 'GET',
        });
        if (cancelled) return;

        const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const normalized = rows.map((row: any, index: number) => normalizePositionRow(row, index));
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
  }, [activeTab, positionFilter, sortBy, debouncedSearch]);

  useEffect(() => {
    if (activeTab !== 'positions' || positionsLoading || positionsLoadingMore || !hasMorePositions) return;
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
          const params = new URLSearchParams({
            user_id: authUser?.id.toString() ?? '3',
            status: positionFilter === 'active' ? 'OPEN' : 'CLOSED',
            search: debouncedSearch,
            limit: String(PAGE_SIZE),
            offset: String(nextOffsetRef.current),
            order: mapSortOptionToApi(sortBy),
            ascending: ascending ? 'true' : 'false',
          });
          if (debouncedSearch) {
            params.set('search', debouncedSearch);
          }

          const res = await apiFetchWithToken<any>(`/users/positions?${params.toString()}`, {
            method: 'GET',
          });
          const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          const normalized = rows.map((row: any, index: number) =>
            normalizePositionRow(row, nextOffsetRef.current + index)
          );

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
  }, [activeTab, debouncedSearch, hasMorePositions, positionFilter, positionsLoading, positionsLoadingMore, sortBy]);

  useEffect(() => {
    if (activeTab !== 'activity') return;
    let cancelled = false;

    async function loadTrades() {
      setTradesLoading(true);
      setTradesError(null);
      setTrades([]);
      setHasMoreTrades(true);
      tradesNextOffsetRef.current = 0;
      try {
        const params = new URLSearchParams({
          user_id: authUser?.id.toString() ?? '3',
          limit: String(PAGE_SIZE),
          offset: '0',
          order: 'created_at',
          ascending: 'false',
        });
        const res = await apiFetchWithToken<any>(`/users/trades?${params.toString()}`, {
          method: 'GET',
        });
        if (cancelled) return;

        const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const normalized = rows.map((row: any, index: number) => normalizeTradeRow(row, index));
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
  }, [activeTab, authUser?.id]);

  useEffect(() => {
    if (activeTab !== 'activity' || tradesLoading || tradesLoadingMore || !hasMoreTrades) return;
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
          const params = new URLSearchParams({
            user_id: authUser?.id.toString() ?? '3',
            limit: String(PAGE_SIZE),
            offset: String(tradesNextOffsetRef.current),
            order: 'created_at',
            ascending: 'false',
          });
          const res = await apiFetchWithToken<any>(`/users/trades?${params.toString()}`, {
            method: 'GET',
          });
          const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          const normalized = rows.map((row: any, index: number) =>
            normalizeTradeRow(row, tradesNextOffsetRef.current + index)
          );

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
  }, [activeTab, authUser?.id, hasMoreTrades, tradesLoading, tradesLoadingMore]);

  return (
    <div className="container mx-auto space-y-6 px-2.5 py-4 sm:space-y-7 sm:px-6 sm:py-6 lg:px-8">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardContent className="space-y-5 p-3 sm:p-4">
            <div className="flex items-start items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="h-14 w-14 shrink-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 20% 20%, #ed1c24 0%, #c4001d 35%, #3c4df8 75%, #4e01a8 100%)',
                  }}
                />
                <div className="min-w-0 items-center">
                  <h1 className="truncate text-xl sm:text-3xl font-bold leading-tight">{profileName}</h1>
                  <p className="text-sm sm:text-md text-muted-foreground">Joined Mar 2026 · 0 views</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xl sm:text-2xl font-bold leading-none">π 0.00</p>
                <p className="text-xs text-muted-foreground sm:text-sm">Positions Value</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold leading-none">π 0.00</p>
                <p className="text-xs text-muted-foreground sm:text-sm">Biggest Win</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold leading-none">0</p>
                <p className="text-xs text-muted-foreground sm:text-sm">Predictions</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button className="w-full">
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Deposit
              </Button>
              <Button
                variant="outline"
                className="w-full text-muted-foreground hover:text-foreground"
                disabled
              >
                <ArrowUpFromLine className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="space-y-6 p-3 sm:space-y-7 sm:p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Profit/Loss</p>
                <p className="text-2xl sm:text-3xl font-bold leading-none">π 0.00</p>
                <p className="mt-2 text-sm text-muted-foreground">Past Day</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-end gap-2 text-xs font-semibold text-muted-foreground">
                  <button
                    type="button"
                    className="rounded-md bg-primary/15 px-2 py-1 text-primary hover:bg-primary/20"
                  >
                    1D
                  </button>
                  <button type="button" className="rounded-md px-2 py-1 hover:bg-secondary">
                    1W
                  </button>
                  <button type="button" className="rounded-md px-2 py-1 hover:bg-secondary">
                    1M
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 hover:bg-secondary"
                  >
                    ALL
                  </button>
                </div>
              </div>
            </div>

            <div className="h-20 rounded-md bg-gradient-to-r from-primary/30 via-primary/15 to-transparent" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'positions' | 'activity')} className="w-full">
          <TabsList className="h-auto gap-4 bg-transparent p-0">
            <TabsTrigger
              value="positions"
              className="px-0 text-lg sm:text-xl font-bold data-[state=active]:shadow-none"
            >
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="px-0 text-lg sm:text-xl font-bold data-[state=active]:shadow-none"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-3">
            <div className="space-y-3 md:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex rounded-lg border border-border p-1">
                  <button
                    type="button"
                    onClick={() => setPositionFilter('active')}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-sm font-semibold',
                      positionFilter === 'active'
                        ? 'bg-secondary text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setPositionFilter('closed')}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                      positionFilter === 'closed'
                        ? 'bg-secondary text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Closed
                  </button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 min-w-[7.3rem] justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        {sortBy}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => setSortBy(option)}
                        className="flex items-center justify-between"
                      >
                        {option}
                        {sortBy === option ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search positions"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="flex rounded-lg border border-border p-1">
                <button
                  type="button"
                  onClick={() => setPositionFilter('active')}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                    positionFilter === 'active'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setPositionFilter('closed')}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                    positionFilter === 'closed'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Closed
                </button>
              </div>

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search positions"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 min-w-[7.3rem] justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {sortBy}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onSelect={() => setSortBy(option)}
                      className="flex items-center justify-between"
                    >
                      {option}
                      {sortBy === option ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

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
                      <TableHead className="uppercase tracking-wide text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          Market
                        </span>
                      </TableHead>
                      <TableHead className="hidden text-right uppercase tracking-wide text-[11px] sm:table-cell">
                        <span className="inline-flex items-center gap-1">
                          Avg
                        </span>
                      </TableHead>
                      <TableHead className="hidden text-right uppercase tracking-wide text-[11px] md:table-cell">
                        Current
                      </TableHead>
                      <TableHead className="text-right uppercase tracking-wide text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          Profit/Loss
                        </span>
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

                        return (
                          <TableRow key={position.id}>
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
                              <p className="text-sm md:text-md font-bold leading-none">{position.currentPiAmount.toFixed(2)}π</p>
                              <p className={cn('mt-1 text-xs font-semibold', pnlClass)}>
                                {toSignedMoney(position.pnl)} ({toPercentLabel(position.pnlPercent)})
                              </p>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {hasMorePositions && !positionsLoading && activeTab === 'positions' ? (
              <div ref={sentinelRef} className="h-6" aria-hidden="true" />
            ) : null}
            {positionsLoadingMore ? (
              <p className="text-center text-sm text-muted-foreground">Loading more positions...</p>
            ) : null}
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
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
                        <TableHead className="w-28 uppercase tracking-wide text-[11px]">Type</TableHead>
                        <TableHead className="uppercase tracking-wide text-[11px]">Market</TableHead>
                        <TableHead className="w-20 md:w-40 text-right uppercase tracking-wide text-[11px]">Amount</TableHead>
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
                        trades.map((trade) => (
                          <TableRow key={`trade-desktop-${trade.id}-${trade.createdAt}`}>
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
                              <p className="text-sm font-bold leading-none">${trade.piAmount.toFixed(2)}</p>
                              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                {toRelativeTimeLabel(trade.createdAt)}
                                {/* <SquareArrowOutUpRight className="h-3 w-3" /> */}
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
            {hasMoreTrades && !tradesLoading && activeTab === 'activity' ? (
              <div ref={tradesSentinelRef} className="h-6" aria-hidden="true" />
            ) : null}
            {tradesLoadingMore ? (
              <p className="text-center text-sm text-muted-foreground">Loading more activity...</p>
            ) : null}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

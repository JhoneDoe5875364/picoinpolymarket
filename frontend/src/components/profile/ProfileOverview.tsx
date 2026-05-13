'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, MessageSquarePlus, Pencil, Wallet } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { apiFetchWithToken } from '@/lib/api';
import { cn, roundLocalePi, toNumber, toSignedMoney } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SuggestMarketForm } from '@/components/market/SuggestMarketForm';

type PnlPeriod = '1D' | '1W' | '1M' | 'ALL';

type OverviewStats = {
  positionsValue: number;
  biggestWin: number;
  predictions: number;
  profitLoss: number;
};

type PnlHistoryPoint = {
  timestamp: number;
  profitLoss: number;
  markValue: number;
  costBasis: number;
};

type OverviewPayload = {
  stats: OverviewStats;
  pnlHistory: PnlHistoryPoint[];
};

type AccountWalletInfo = {
  pi_uid?: string | null;
  pi_username?: string | null;
  payout_destination?: string | null;
  last_pi_verified_at?: string | null;
};

function formatWalletPreview(addr: string | null | undefined): string {
  const s = (addr ?? '').trim();
  if (!s) return '—';
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

function formatVerifiedTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const overviewCache = new Map<string, OverviewPayload>();
const overviewInFlight = new Map<string, Promise<OverviewPayload>>();

const PERIODS: Array<{ key: PnlPeriod; label: string; caption: string }> = [
  { key: '1D', label: '1D', caption: 'Past Day' },
  { key: '1W', label: '1W', caption: 'Past Week' },
  { key: '1M', label: '1M', caption: 'Past Month' },
  { key: 'ALL', label: 'ALL', caption: 'All Time' },
];

const chartConfig = {
  profitLoss: {
    label: 'Profit/Loss',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

function normalizeTimestamp(value: unknown): number {
  if (typeof value === 'number') return value < 1_000_000_000_000 ? value * 1000 : value;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function formatXAxisLabel(value: number, period: PnlPeriod): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  if (period === '1D') {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  if (period === 'ALL') {
    return date.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTooltipTimestamp(value: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizePnlHistory(rows: any[]): PnlHistoryPoint[] {
  return rows.map((item: any) => ({
    timestamp: normalizeTimestamp(item?.timestamp),
    profitLoss: toNumber(item?.profit_loss),
    markValue: toNumber(item?.mark_value),
    costBasis: toNumber(item?.cost_basis),
  }));
}

async function fetchProfileOverview(userId: string, period: PnlPeriod): Promise<OverviewPayload> {
  const cacheKey = `${userId}:${period}`;
  const cached = overviewCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const pending = overviewInFlight.get(cacheKey);
  if (pending) {
    return pending;
  }

  const request = (async () => {
  const [marketsRes, positionsRes, biggestWinRes, pnlRes, pnlHistoryRes] = await Promise.all([
    apiFetchWithToken<any>(`/users/total-markets-traded?user_id=${userId}`, { method: 'GET' }),
    apiFetchWithToken<any>(`/users/total-positions-value?user_id=${userId}`, { method: 'GET' }),
    apiFetchWithToken<any>(`/users/biggest-win?user_id=${userId}`, { method: 'GET' }),
    apiFetchWithToken<any>(`/users/pnl?user_id=${userId}&period=${period}`, { method: 'GET' }),
    apiFetchWithToken<any>(`/users/pnl-history?user_id=${userId}&period=${period}`, { method: 'GET' }),
  ]);

    const payload: OverviewPayload = {
      stats: {
        predictions: toNumber(marketsRes?.data?.total_markets_traded),
        positionsValue: toNumber(positionsRes?.data?.total_positions_value),
        biggestWin: toNumber(biggestWinRes?.data?.biggest_win),
        profitLoss: toNumber(pnlRes?.data?.profit_loss),
      },
      pnlHistory: normalizePnlHistory(Array.isArray(pnlHistoryRes?.data?.history) ? pnlHistoryRes.data.history : []),
    };
    overviewCache.set(cacheKey, payload);
    return payload;
  })();

  overviewInFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    overviewInFlight.delete(cacheKey);
  }
}

export function ProfileOverview() {
  const { ppxUser } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<PnlPeriod>('1D');
  const [stats, setStats] = useState<OverviewStats>({
    positionsValue: 0,
    biggestWin: 0,
    predictions: 0,
    profitLoss: 0,
  });
  const [pnlHistory, setPnlHistory] = useState<PnlHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [walletInfo, setWalletInfo] = useState<AccountWalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const profileName = useMemo(() => {
    return (ppxUser?.username ?? 'Unknown User');
  }, [ppxUser]);

  const selectedPeriodCaption = useMemo(
    () => PERIODS.find((item) => item.key === selectedPeriod)?.caption ?? 'Past Day',
    [selectedPeriod]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setIsLoading(true);
      setError(null);
      try {
        const userId = ppxUser?.id?.toString() ?? '3';
        const payload = await fetchProfileOverview(userId, selectedPeriod);
        if (cancelled) return;
        setStats(payload.stats);
        setPnlHistory(payload.pnlHistory);
      } catch (loadError: any) {
        if (cancelled) return;
        setPnlHistory([]);
        setError(loadError?.message ?? 'Failed to load profile overview.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, [ppxUser?.id, selectedPeriod]);

  useEffect(() => {
    let cancelled = false;

    async function loadWalletInfo() {
      if (!ppxUser?.id) {
        setWalletInfo(null);
        setWalletError(null);
        return;
      }
      setWalletLoading(true);
      setWalletError(null);
      try {
        const res = await apiFetchWithToken<{ ok?: boolean; info?: AccountWalletInfo }>('/account/info', {
          method: 'GET',
        });
        if (cancelled) return;
        setWalletInfo(res?.info ?? null);
      } catch (e: unknown) {
        if (cancelled) return;
        setWalletInfo(null);
        setWalletError(e instanceof Error ? e.message : 'Failed to load wallet info.');
      } finally {
        if (!cancelled) {
          setWalletLoading(false);
        }
      }
    }

    loadWalletInfo();
    return () => {
      cancelled = true;
    };
  }, [ppxUser?.id]);

  const piUsernameDisplay = walletInfo?.pi_username?.trim() || profileName;
  const piUidDisplay = walletInfo?.pi_uid?.trim() || '—';
  const payoutDisplay = formatWalletPreview(walletInfo?.payout_destination);

  const pnlClassName =
    stats.profitLoss > 0
      ? 'text-emerald-500 dark:text-emerald-400'
      : stats.profitLoss < 0
        ? 'text-rose-500 dark:text-rose-400'
        : 'text-foreground';

  return (
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
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      type="button"
                      onClick={() => setSuggestDialogOpen(true)}
                    >
                      <MessageSquarePlus className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Suggest</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Suggest a market</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
                      <Pencil className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Edit Profile</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Edit Profile</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">{roundLocalePi(stats.positionsValue)}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Positions Value</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">{roundLocalePi(stats.biggestWin)}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Biggest Win</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">{stats.predictions}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Predictions</p>
            </div>
          </div>

          {ppxUser?.id ? (
            <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Wallet</p>
              </div>
              {walletLoading ? (
                <div className="mt-3 h-16 animate-pulse rounded-md bg-muted/40" />
              ) : walletError ? (
                <p className="mt-2 text-xs text-destructive">{walletError}</p>
              ) : (
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground">Pi username</dt>
                    <dd className="max-w-[min(100%,14rem)] truncate text-right font-medium">
                      {piUsernameDisplay}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground shrink-0">Pi user ID</dt>
                    <dd
                      className="max-w-[min(100%,14rem)] truncate text-right font-mono text-xs text-muted-foreground"
                      title={piUidDisplay !== '—' ? piUidDisplay : undefined}
                    >
                      {piUidDisplay}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground shrink-0">Payout destination</dt>
                    <dd
                      className="max-w-[min(100%,14rem)] truncate text-right font-mono text-xs font-medium"
                      title={
                        walletInfo?.payout_destination?.trim()
                          ? walletInfo.payout_destination.trim()
                          : undefined
                      }
                    >
                      {payoutDisplay}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground shrink-0">Last verified</dt>
                    <dd className="text-right text-xs text-muted-foreground">
                      {formatVerifiedTimestamp(walletInfo?.last_pi_verified_at)}
                    </dd>
                  </div>
                </dl>
              )}
              {!walletLoading && !walletError ? (
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  Payout destination shows your linked mainnet address when it is stored on leaderboard rows.
                  Last verified updates each time you complete Pi Browser authentication.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button className="w-full">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Send Pi
            </Button>
            <Button
              variant="outline"
              className="w-full text-muted-foreground hover:text-foreground"
              disabled
            >
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Receive Pi
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <CardContent className="flex flex-1 flex-col gap-6 p-3 sm:gap-7 sm:p-4 lg:min-h-0">
          <div className="flex shrink-0 items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Profit/Loss</p>
              <p className={cn('text-2xl sm:text-3xl font-bold leading-none', pnlClassName)}>
                {toSignedMoney(stats.profitLoss)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{selectedPeriodCaption}</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-end gap-2 text-xs font-semibold text-muted-foreground">
                {PERIODS.map((period) => (
                  <button
                    key={period.key}
                    type="button"
                    className={cn(
                      'rounded-md px-2 py-1 hover:bg-secondary',
                      selectedPeriod === period.key && 'bg-primary/15 text-primary hover:bg-primary/20'
                    )}
                    onClick={() => setSelectedPeriod(period.key)}
                    disabled={isLoading}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? <p className="shrink-0 text-sm text-destructive">{error}</p> : null}

          <div className="relative h-28 shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
            {isLoading ? (
              <div className="absolute inset-0 animate-pulse rounded-md bg-muted/40" />
            ) : pnlHistory.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
                No PnL history
              </div>
            ) : (
              <ChartContainer
                config={chartConfig}
                className="absolute inset-0 h-full w-full aspect-auto [&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:!w-full"
              >
                <LineChart data={pnlHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatXAxisLabel(Number(value), selectedPeriod)}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    orientation="right"
                    tickFormatter={(value) => `${Number(value).toFixed(0)}π`}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={(props) => {
                      const { content: _content, ...tooltipProps } = props;
                      return (
                        <ChartTooltipContent
                          {...tooltipProps}
                          labelFormatter={(value, payload) => {
                            const payloadTimestamp = payload?.[0]?.payload?.timestamp;
                            return formatTooltipTimestamp(Number(payloadTimestamp ?? value));
                          }}
                          formatter={(value: any) => toSignedMoney(toNumber(value))}
                        />
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profitLoss"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Suggest New Market</DialogTitle>
            <DialogDescription>
              Submit question, description, category, and start/end date for admin review.
            </DialogDescription>
          </DialogHeader>
          <SuggestMarketForm
            onSubmitted={() => {
              setSuggestDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

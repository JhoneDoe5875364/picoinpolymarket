'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Pencil } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { apiFetchWithToken } from '@/lib/api';
import { cn, toSignedMoney, toUnsignedMoney } from '@/lib/utils';

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

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

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
  const [marketsRes, positionsRes, biggestWinRes, pnlRes, pnlHistoryRes] = await Promise.all([
    apiFetchWithToken<any>(`/users/total-markets-traded?user_id=${userId}`, { method: 'GET' }),
    apiFetchWithToken<any>(`/users/total-positions-value?user_id=${userId}`, { method: 'GET' }),
    apiFetchWithToken<any>(`/users/biggest-win?user_id=${userId}`, { method: 'GET' }),
    apiFetchWithToken<any>(`/users/pnl?user_id=${userId}&period=${period}`, { method: 'GET' }),
    apiFetchWithToken<any>(`/users/pnl-history?user_id=${userId}&period=${period}`, { method: 'GET' }),
  ]);

  return {
    stats: {
      predictions: toNumber(marketsRes?.data?.total_markets_traded),
      positionsValue: toNumber(positionsRes?.data?.total_positions_value),
      biggestWin: toNumber(biggestWinRes?.data?.biggest_win),
      profitLoss: toNumber(pnlRes?.data?.profit_loss),
    },
    pnlHistory: normalizePnlHistory(Array.isArray(pnlHistoryRes?.data?.history) ? pnlHistoryRes.data.history : []),
  };
}

export function ProfileOverview() {
  const { authUser } = useAuth();
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

  const profileName = useMemo(() => {
    return (
      authUser?.wallet_address ??
      authUser?.address ??
      authUser?.pi_username ??
      '0x7883590f9f3Dc4...'
    );
  }, [authUser]);

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
        const userId = authUser?.id?.toString() ?? '3';
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
  }, [authUser?.id, selectedPeriod]);

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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">{toUnsignedMoney(stats.positionsValue)}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Positions Value</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">{toUnsignedMoney(stats.biggestWin)}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Biggest Win</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">{stats.predictions}</p>
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

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {isLoading ? (
            <div className="h-28 animate-pulse rounded-md bg-muted/40" />
          ) : pnlHistory.length === 0 ? (
            <div className="h-28 rounded-md border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground">
              No PnL history
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-28 w-full aspect-auto">
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
        </CardContent>
      </Card>
    </section>
  );
}

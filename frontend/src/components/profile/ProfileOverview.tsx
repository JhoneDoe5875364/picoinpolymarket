'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Re-add `ArrowDownToLine, ArrowUpFromLine` with the Send/Receive Pi block and
// `Pencil` with the Edit Profile button — both are commented out below.
import { MessageSquarePlus, Wallet } from 'lucide-react';
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineType,
  createChart,
  type AreaData,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type SingleValueData,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { format, isValid } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetchWithToken } from '@/lib/api';
import { TRADE_COPY } from '@/lib/copy/trade';
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
  created_at?: string | null;
};

function formatWalletPreview(addr: string | null | undefined): string {
  const s = (addr ?? '').trim();
  if (!s) return '—';
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

/** "Joined Mar 2026", or null when the account has no usable created_at. */
function formatJoinedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!isValid(d)) return null;
  return `Joined ${format(d, 'MMM yyyy')}`;
}

/** Used only by the commented-out Wallet card. */
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

const PNL_LINE_COLOR = '#2E5CFF';
const PNL_AREA_TOP = 'rgba(46, 92, 255, 0.35)';
const PNL_AREA_BOTTOM = 'rgba(46, 92, 255, 0)';

function getChartTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    text: isDark ? 'hsl(220, 11%, 72%)' : 'hsl(0, 0%, 40%)',
    grid: isDark ? 'hsla(223, 20%, 24%, 0.55)' : 'hsla(0, 0%, 89%, 0.55)',
    crosshair: isDark ? 'hsla(223, 20%, 40%, 0.8)' : 'hsla(0, 0%, 70%, 0.8)',
    crosshairLabel: isDark ? 'hsl(224, 29%, 12%)' : 'hsl(0, 0%, 100%)',
  };
}

function timeToMs(time: Time): number {
  if (typeof time === 'number') return time * 1000;
  if (typeof time === 'string') return Date.parse(time);
  return Date.UTC(time.year, time.month - 1, time.day);
}

function toPnlSeriesData(points: PnlHistoryPoint[]): SingleValueData<Time>[] {
  const bySecond = new Map<number, PnlHistoryPoint>();
  for (const point of points) {
    bySecond.set(Math.floor(point.timestamp / 1000), point);
  }
  return Array.from(bySecond.entries())
    .sort(([a], [b]) => a - b)
    .map(([seconds, point]) => ({
      time: seconds as UTCTimestamp,
      value: point.profitLoss,
    }));
}

type PnlChartTooltip = {
  x: number;
  y: number;
  label: string;
  value: number;
};

function ProfilePnlChart({
  points,
  period,
  className,
}: {
  points: PnlHistoryPoint[];
  period: PnlPeriod;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [tooltip, setTooltip] = useState<PnlChartTooltip | null>(null);

  const seriesData = useMemo(() => toPnlSeriesData(points), [points]);

  const applyTheme = useCallback((chart: IChartApi) => {
    const theme = getChartTheme();
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: theme.text,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: theme.grid },
      },
      crosshair: {
        vertLine: {
          color: theme.crosshair,
          labelBackgroundColor: theme.crosshairLabel,
        },
        horzLine: {
          color: theme.crosshair,
          labelBackgroundColor: theme.crosshairLabel,
        },
      },
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        attributionLogo: false,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0 },
      },
      leftPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: period === '1D',
        fixLeftEdge: true,
        fixRightEdge: true,
        minBarSpacing: 0.5,
        tickMarkFormatter: (time: Time) => formatXAxisLabel(timeToMs(time), period),
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { labelVisible: false },
      },
      localization: {
        priceFormatter: (price: number) => `${Math.round(price)}π`,
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: PNL_LINE_COLOR,
      topColor: PNL_AREA_TOP,
      bottomColor: PNL_AREA_BOTTOM,
      lineWidth: 2,
      lineType: LineType.WithSteps,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    applyTheme(chart);

    const onCrosshairMove = (param: MouseEventParams<Time>) => {
      if (
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0 ||
        param.time === undefined
      ) {
        setTooltip(null);
        return;
      }

      const entry = param.seriesData.get(series) as AreaData<Time> | undefined;
      if (entry?.value === undefined) {
        setTooltip(null);
        return;
      }

      const date = new Date(timeToMs(param.time));
      const label = isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : '-';

      setTooltip({
        x: param.point.x,
        y: param.point.y,
        label,
        value: entry.value,
      });
    };

    chart.subscribeCrosshairMove(onCrosshairMove);

    chartRef.current = chart;
    seriesRef.current = series;

    const themeObserver = new MutationObserver(() => {
      if (chartRef.current) applyTheme(chartRef.current);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      themeObserver.disconnect();
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [applyTheme, period]);

  useEffect(() => {
    seriesRef.current?.setData(seriesData);
    const chart = chartRef.current;
    if (!chart || seriesData.length === 0) return;
    chart.timeScale().fitContent();
  }, [seriesData]);

  const valueClassName =
    tooltip && tooltip.value > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : tooltip && tooltip.value < 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-foreground';

  return (
    <div className={cn('relative w-full', className)}>
      <div ref={containerRef} className="h-full min-h-[120px] w-full" />
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs shadow-md"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <p className="mb-1.5 text-muted-foreground">{tooltip.label}</p>
          <p className={cn('font-semibold', valueClassName)}>{toSignedMoney(tooltip.value)}</p>
        </div>
      ) : null}
    </div>
  );
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

  // Kept for the commented-out Wallet card below — unused while it stays disabled.
  const piUsernameDisplay = walletInfo?.pi_username?.trim() || profileName;
  const piUidDisplay = walletInfo?.pi_uid?.trim() || '—';
  const hasPayoutDestination = Boolean(walletInfo?.payout_destination?.trim());
  const payoutDisplay = formatWalletPreview(walletInfo?.payout_destination);

  const joinedLabel = formatJoinedDate(walletInfo?.created_at);

  // An all-zero series still renders as a flat 0π line, which reads as broken.
  // Treat "no points" and "every point is zero" alike: show the zero-state instead.
  const hasPnlActivity = useMemo(
    () => pnlHistory.some((point) => point.profitLoss !== 0),
    [pnlHistory]
  );

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
                {joinedLabel ? (
                  <p className="text-sm sm:text-md text-muted-foreground">{joinedLabel}</p>
                ) : null}
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
                {/*
                  DISABLED — Edit Profile. The button had no onClick and no editor
                  exists; it advertised a capability the app does not have.
                  Restore once a profile editor ships.

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
                      <Pencil className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Edit Profile</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Edit Profile</TooltipContent>
                </Tooltip>
                */}
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

          {/*
            DISABLED — Wallet card and Send/Receive Pi buttons.

            Why: PredictPix never custodies Pi. Predictions are paid straight from
            the user's Pi Wallet at trade time (the `payments` scope is requested
            per payment; no address is ever stored). Showing a wallet balance card
            with Send/Receive controls implied a custodial service and created
            legal/regulatory exposure without providing any function:

              - `Send Pi` / `Receive Pi` had no onClick — both were inert.
              - `Payout destination` reads `leaderboards.wallet_address`, but no
                code anywhere writes that column (the leaderboard updater sets it
                to None), so it can never be populated.
              - `Last verified` displayed `users.updated_at`, not a Pi verification
                timestamp — a mislabelled value.

            Restore this block only after real wallet linking exists: the login flow
            must capture a wallet address and `leaderboards.wallet_address` must be
            written. See docs/feedbacks/20260621_UX_Product_Feedback_Analysis.ko.md (#11).

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
                      className={cn(
                        "max-w-[min(100%,14rem)] truncate text-right text-xs",
                        hasPayoutDestination
                          ? "font-mono font-medium"
                          : "italic text-muted-foreground"
                      )}
                      title={
                        hasPayoutDestination
                          ? walletInfo?.payout_destination?.trim()
                          : undefined
                      }
                    >
                      {hasPayoutDestination ? payoutDisplay : "Not linked yet"}
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
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Your payout destination is the mainnet address linked to your account. It appears
                  here once you complete Pi Browser authentication, which also updates
                  Last verified.
                </p>
              ) : null}
            </div>
          ) : null}

          <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-2 gap-2">
              <Button className="w-full">
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Send Pi
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="w-full">
                    <Button
                      variant="outline"
                      className="w-full text-muted-foreground"
                      disabled
                    >
                      <ArrowUpFromLine className="mr-2 h-4 w-4" />
                      Receive Pi
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Receiving Pi is not available yet — payouts are sent to your linked Pi wallet.
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          */}

          <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/15 px-3 py-3">
            <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                PredictPix never holds your Pi.
              </span>{' '}
              Every prediction is paid straight from your Pi Wallet when you confirm it, and
              payouts are returned to the same wallet.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <CardContent className="flex flex-1 flex-col gap-6 p-3 sm:gap-7 sm:p-4 lg:min-h-0">
          <div className="flex shrink-0 items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{TRADE_COPY.netResultLabel}</p>
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
            ) : !hasPnlActivity ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/60 px-4 text-center">
                <p className="text-sm font-medium text-foreground">No results yet</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Your net result appears here once you place a prediction and the market resolves.
                </p>
              </div>
            ) : (
              <ProfilePnlChart
                points={pnlHistory}
                period={selectedPeriod}
                className="absolute inset-0"
              />
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

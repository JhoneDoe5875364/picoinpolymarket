"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
} from "lightweight-charts"
import { Skeleton } from "../ui/skeleton"
import { apiFetch } from "@/lib/api"
import { Market } from "@/lib/types"
import { format, isValid } from "date-fns"
import { cn, formatPiAmount, roundLocale } from "@/lib/utils"

interface PriceHistoryChartProps {
  market: Market
  /** When set, always loads this interval and hides the interval selector. */
  fixedInterval?: ChartInterval | "ALL"
  /** Show volume stats row (default: true). */
  showFooter?: boolean
  /** Show "Price History" title and interval row (default: same as showFooter). */
  showHeader?: boolean
  /** Omit outer card chrome (for nested layouts like featured market). */
  embedded?: boolean
  className?: string
  chartClassName?: string
}

type PriceHistoryPoint = {
  timestamp: number
  probability: number
}

type ChartPoint = {
  timestamp: number
  yes: number
  no: number
}

const YES_COLOR = "#22c55e"
const NO_COLOR = "#ef4444"

const INTERVAL_OPTIONS = ["1H", "1D", "1W", "1M", "1Y", "ALL"] as const
type ChartInterval = (typeof INTERVAL_OPTIONS)[number]

type CrosshairTooltip = {
  x: number
  y: number
  label: string
  yes: number
  no: number
}

function toApiInterval(interval: ChartInterval | "ALL"): string {
  if (interval === "ALL") return "ALL"
  return interval
}

function normalizeTimestamp(value: unknown): number {
  if (typeof value === "number") {
    return value < 1_000_000_000_000 ? value * 1000 : value
  }

  if (typeof value === "string") {
    const numeric = Number(value)
    if (!Number.isNaN(numeric)) {
      return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric
    }

    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? Date.now() : parsed
  }

  return Date.now()
}

function formatXAxisLabel(
  timestamp: number,
  interval: ChartInterval | "ALL"
): string {
  const date = new Date(timestamp)
  if (!isValid(date)) return "-"
  if (interval === "1H") return format(date, "h:mm a")
  if (interval === "1D") return format(date, "h a")
  return format(date, "MMM d")
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function getChartTheme() {
  const isDark = document.documentElement.classList.contains("dark")
  return {
    text: isDark ? "hsl(220, 11%, 72%)" : "hsl(0, 0%, 40%)",
    grid: isDark ? "hsla(223, 20%, 24%, 0.55)" : "hsla(0, 0%, 89%, 0.55)",
    crosshair: isDark ? "hsla(223, 20%, 40%, 0.8)" : "hsla(0, 0%, 70%, 0.8)",
    crosshairLabel: isDark ? "hsl(224, 29%, 12%)" : "hsl(0, 0%, 100%)",
  }
}

async function loadPriceHistory(
  marketId: number,
  interval: ChartInterval | "ALL"
): Promise<PriceHistoryPoint[]> {
  const params = new URLSearchParams({
    market_id: marketId.toString(),
    interval: toApiInterval(interval),
  })
  const res = await apiFetch(`/markets/prices-history?${params.toString()}`, {
    method: "GET",
  })

  return (res?.data ?? []).map((item: { timestamp?: unknown; probability?: unknown }) => ({
    timestamp: normalizeTimestamp(item.timestamp),
    probability: clampProbability(Number(item.probability)),
  }))
}

function toChartPoints(points: PriceHistoryPoint[]): ChartPoint[] {
  return points.map((point) => {
    const yesPct = point.probability * 100
    return {
      timestamp: point.timestamp,
      yes: yesPct,
      no: 100 - yesPct,
    }
  })
}

function toSeriesData(
  points: ChartPoint[],
  key: "yes" | "no"
): SingleValueData<Time>[] {
  const bySecond = new Map<number, ChartPoint>()
  for (const point of points) {
    bySecond.set(Math.floor(point.timestamp / 1000), point)
  }

  return Array.from(bySecond.entries())
    .sort(([a], [b]) => a - b)
    .map(([seconds, point]) => ({
      time: seconds as UTCTimestamp,
      value: point[key],
    }))
}

function timeToMs(time: Time): number {
  if (typeof time === "number") return time * 1000
  if (typeof time === "string") return Date.parse(time)
  return Date.UTC(time.year, time.month - 1, time.day)
}

type LightweightChartProps = {
  points: ChartPoint[]
  interval: ChartInterval | "ALL"
  className?: string
}

function LightweightPriceChart({
  points,
  interval,
  className,
}: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const yesSeriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const noSeriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const [tooltip, setTooltip] = useState<CrosshairTooltip | null>(null)

  const yesData = useMemo(() => toSeriesData(points, "yes"), [points])
  const noData = useMemo(() => toSeriesData(points, "no"), [points])

  const applyTheme = useCallback((chart: IChartApi) => {
    const theme = getChartTheme()
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
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
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        attributionLogo: false,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0 },
        autoScale: false,
      },
      leftPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: interval === "1H",
        fixLeftEdge: true,
        fixRightEdge: true,
        minBarSpacing: 0.5,
        tickMarkFormatter: (time: Time) =>
          formatXAxisLabel(timeToMs(time), interval),
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { labelVisible: false },
      },
      localization: {
        priceFormatter: (price: number) => `${Math.round(price)}%`,
      },
      handleScroll: true,
      handleScale: true,
    })

    const yesSeries = chart.addSeries(AreaSeries, {
      lineColor: YES_COLOR,
      topColor: "rgba(34, 197, 94, 0.35)",
      bottomColor: "rgba(34, 197, 94, 0)",
      lineWidth: 2,
      lineType: LineType.WithSteps,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    const noSeries = chart.addSeries(AreaSeries, {
      lineColor: NO_COLOR,
      topColor: "rgba(239, 68, 68, 0.35)",
      bottomColor: "rgba(239, 68, 68, 0)",
      lineWidth: 2,
      lineType: LineType.WithSteps,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    chart.priceScale("right").setVisibleRange({ from: 0, to: 100 })
    applyTheme(chart)

    const onCrosshairMove = (param: MouseEventParams<Time>) => {
      if (
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0 ||
        param.time === undefined
      ) {
        setTooltip(null)
        return
      }

      const yesEntry = param.seriesData.get(yesSeries) as AreaData<Time> | undefined
      const noEntry = param.seriesData.get(noSeries) as AreaData<Time> | undefined
      const yes = yesEntry?.value
      const no = noEntry?.value

      if (yes === undefined && no === undefined) {
        setTooltip(null)
        return
      }

      const date = new Date(timeToMs(param.time))
      const label = isValid(date) ? format(date, "MMM d, yyyy h:mm a") : "-"

      setTooltip({
        x: param.point.x,
        y: param.point.y,
        label,
        yes: yes ?? (no !== undefined ? 100 - no : 0),
        no: no ?? (yes !== undefined ? 100 - yes : 0),
      })
    }

    chart.subscribeCrosshairMove(onCrosshairMove)

    chartRef.current = chart
    yesSeriesRef.current = yesSeries
    noSeriesRef.current = noSeries

    const themeObserver = new MutationObserver(() => {
      if (chartRef.current) applyTheme(chartRef.current)
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      themeObserver.disconnect()
      chart.unsubscribeCrosshairMove(onCrosshairMove)
      chart.remove()
      chartRef.current = null
      yesSeriesRef.current = null
      noSeriesRef.current = null
    }
  }, [applyTheme, interval])

  useEffect(() => {
    yesSeriesRef.current?.setData(yesData)
    noSeriesRef.current?.setData(noData)

    const chart = chartRef.current
    if (!chart || yesData.length === 0) return

    chart.timeScale().fitContent()
    chart.priceScale("right").setVisibleRange({ from: 0, to: 100 })
  }, [yesData, noData])

  return (
    <div className={cn("relative w-full max-w-full overflow-hidden", className)}>
      <div ref={containerRef} className="h-full min-h-[120px] w-full max-w-full" />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs shadow-md"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <p className="mb-1.5 text-muted-foreground">{tooltip.label}</p>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Yes {tooltip.yes.toFixed(1)}%
            </p>
            <p className="font-semibold text-rose-600 dark:text-rose-400">
              No {tooltip.no.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-md font-bold text-foreground sm:text-xl">{value}</p>
    </div>
  )
}

export function PriceHistoryChart({
  market,
  fixedInterval,
  showFooter = true,
  showHeader,
  embedded = false,
  className,
  chartClassName,
}: PriceHistoryChartProps) {
  const [chartData, setChartData] = useState<PriceHistoryPoint[] | null>(null)
  const [interval, setInterval] = useState<ChartInterval>("1W")
  const resolvedInterval: ChartInterval | "ALL" =
    fixedInterval === "ALL" ? "ALL" : (fixedInterval ?? interval)
  const headerVisible = showHeader ?? showFooter

  const chartPoints = useMemo(
    () => (chartData ? toChartPoints(chartData) : []),
    [chartData]
  )

  useEffect(() => {
    if (!market?.id) return
    let cancelled = false
    ;(async () => {
      const res = await loadPriceHistory(market.id, resolvedInterval)
      if (!cancelled) setChartData(res)
    })()
    return () => {
      cancelled = true
    }
  }, [market.id, resolvedInterval])

  if (!chartData) {
    return (
      <Skeleton
        className={cn(
          "w-full rounded-xl",
          headerVisible ? "h-[420px]" : "h-32",
          chartClassName,
          className
        )}
      />
    )
  }

  // Candles are built from trades by a periodic updater, so a freshly-traded or
  // brand-new market has no history yet. Explain that instead of a blank chart.
  if (chartPoints.length === 0) {
    return (
      <section
        className={cn(
          "flex w-full max-w-full min-w-0 flex-col items-center justify-center gap-2 text-center",
          !embedded && "rounded-xl border border-border/60 bg-card p-6 shadow-sm",
          headerVisible ? "min-h-[200px]" : "min-h-32",
          chartClassName,
          className
        )}
      >
        <p className="text-sm font-semibold text-foreground">No price history yet</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          The chart appears once trades start building the market&apos;s price history.
          Check back shortly after the first trades.
        </p>
      </section>
    )
  }

  const volume7d = Number(market.volume_1w ?? market.volume ?? 0)
  const volume24h = Number(market.volume_24h ?? 0)
  const traders = Number(market.traders ?? market.trades_total ?? 0)
  const holders = Number(market.holders ?? 0)

  return (
    <section
      className={cn(
        "w-full max-w-full min-w-0",
        embedded && "overflow-hidden",
        !embedded && "rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {headerVisible && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-md font-bold text-foreground">Price History</h2>
          {!fixedInterval && (
            <div className="flex flex-wrap items-center gap-1">
              {INTERVAL_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInterval(value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                    interval === value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <LightweightPriceChart
        points={chartPoints}
        interval={resolvedInterval}
        className={cn(
          "aspect-auto h-[280px] w-full sm:h-[300px]",
          chartClassName
        )}
      />

      {showFooter && (
        <div className="mt-5 grid grid-cols-4 gap-4 text-center sm:grid-cols-4 sm:gap-6">
          <StatBlock label="Volume (7D)" value={formatPiAmount(volume7d)} />
          <StatBlock label="24h Volume" value={formatPiAmount(volume24h)} />
          <StatBlock label="Traders" value={roundLocale(traders)} />
          <StatBlock label="Holders" value={roundLocale(holders)} />
        </div>
      )}
    </section>
  )
}

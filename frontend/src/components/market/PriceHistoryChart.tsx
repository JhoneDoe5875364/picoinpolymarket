"use client"

import { useEffect, useId, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, type ChartConfig } from "../ui/chart"
import { Skeleton } from "../ui/skeleton"
import { apiFetch } from "@/lib/api"
import { Market } from "@/lib/types"
import { format, isValid } from "date-fns"
import { cn, roundLocale, roundLocalePi } from "@/lib/utils"

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

const chartConfig = {
  yes: { label: "Yes", color: "#22c55e" },
  no: { label: "No", color: "#ef4444" },
} satisfies ChartConfig

type PriceHistoryPoint = {
  timestamp: number
  probability: number
}

type ChartPoint = {
  timestamp: number
  yes: number
  no: number
}

const INTERVAL_OPTIONS = ["1H", "1D", "1W", "1M", "1Y", "ALL"] as const
type ChartInterval = (typeof INTERVAL_OPTIONS)[number]

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

type ChartTooltipProps = {
  active?: boolean
  payload?: { payload?: ChartPoint }[]
}

function PriceHistoryTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  const date = new Date(point.timestamp)
  const label = isValid(date) ? format(date, "MMM d, yyyy h:mm a") : "-"

  return (
    <div className="rounded-lg border border-border/80 bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
          Yes {point.yes.toFixed(1)}%
        </p>
        <p className="font-semibold text-rose-600 dark:text-rose-400">No {point.no.toFixed(1)}%</p>
      </div>
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
  const chartUid = useId().replace(/:/g, "")
  const yesFillId = `priceHistoryYesFill-${chartUid}`
  const noFillId = `priceHistoryNoFill-${chartUid}`

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

  const volume7d = Number(market.volume_1w ?? market.volume ?? 0)
  const volume24h = Number(market.volume_24h ?? 0)
  const traders = Number(market.traders ?? market.trades_total ?? 0)
  const holders = Number(market.holders ?? 0)

  return (
    <section
      className={cn(
        "w-full",
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

      <ChartContainer
        config={chartConfig}
        className={cn(
          "aspect-auto h-[280px] w-full sm:h-[300px]",
          "[&_.recharts-cartesian-grid_horizontal]:stroke-border/40",
          chartClassName
        )}
      >
        <AreaChart
          accessibilityLayer={false}
          data={chartPoints}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={yesFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={noFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="0" stroke="hsl(var(--border) / 0.35)" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) =>
              formatXAxisLabel(Number(value), resolvedInterval)
            }
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            dy={8}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<PriceHistoryTooltip />} />
          <Area
            type="stepAfter"
            dataKey="yes"
            stroke="#22c55e"
            strokeWidth={2}
            fill={`url(#${yesFillId})`}
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="stepAfter"
            dataKey="no"
            stroke="#ef4444"
            strokeWidth={2}
            fill={`url(#${noFillId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>

      {showFooter && (
        <div className="mt-5 grid grid-cols-4 gap-4 sm:grid-cols-4 sm:gap-6 text-center">
          <StatBlock label="Volume (7D)" value={roundLocalePi(volume7d)} />
          <StatBlock label="24h Volume" value={roundLocalePi(volume24h)} />
          <StatBlock label="Traders" value={roundLocale(traders)} />
          <StatBlock label="Holders" value={roundLocale(holders)} />
        </div>
      )}
    </section>
  )
}


"use client"

import { useEffect, useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "./ui/chart"
import { Skeleton } from "./ui/skeleton"
import { apiFetch } from "@/lib/api"
import { Market } from "@/lib/types"
import { Clock } from "lucide-react"
import { format, isValid } from "date-fns"
import { cn } from "@/lib/utils"

interface PriceHistoryChartProps {
  market: Market
}

const chartConfig = {
  probability: {
    label: "Probability",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type PriceHistoryPoint = {
  timestamp: number
  probability: number
}

const INTERVAL_OPTIONS = ["1H", "1D", "1W", "1M", "MAX"] as const
type ChartInterval = (typeof INTERVAL_OPTIONS)[number]

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

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatXAxisTime(timestamp: number): string {
  const date = new Date(timestamp)
  if (!isValid(date)) return "-"
  return format(date, "hh:mm a")
}

function formatXAxisDate(timestamp: number): string {
  const date = new Date(timestamp)
  if (!isValid(date)) return "-"
  return format(date, "MMM d")
}

function formatDate(value?: string | null, pattern: string = "PP"): string {
  if (!value) return "-"
  const date = new Date(value)
  if (!isValid(date)) return "-"
  return format(date, pattern)
}

async function loadPriceHistory(market_id: number, interval: string): Promise<PriceHistoryPoint[]> {
  const params = new URLSearchParams({
    market_id: market_id.toString(),
    interval: interval,
  });
  const res = await apiFetch(`/markets/prices-history?${params.toString()}`, {
    method: "GET",
  });

  return (res?.data ?? []).map((item: any) => ({
    timestamp: normalizeTimestamp(item.timestamp),
    probability: Number(item.probability),
  }));
}


export function PriceHistoryChart({ market }: PriceHistoryChartProps) {
  const [chartData, setChartData] = useState<PriceHistoryPoint[] | null>(null)
  const [interval, setInterval] = useState<ChartInterval>("1D")
  const xAxisLabelMode = useMemo<"time" | "date">(() => {
    if (!chartData || chartData.length < 2) {
      return "time"
    }

    let minTimestamp = Number.POSITIVE_INFINITY
    let maxTimestamp = Number.NEGATIVE_INFINITY

    for (const point of chartData) {
      minTimestamp = Math.min(minTimestamp, point.timestamp)
      maxTimestamp = Math.max(maxTimestamp, point.timestamp)
    }

    const dayInMs = 24 * 60 * 60 * 1000
    return maxTimestamp - minTimestamp >= dayInMs ? "date" : "time"
  }, [chartData, interval])

  useEffect(() => {
    if (!market) return;
    (async () => {
      const res = await loadPriceHistory(market.id, interval);
      setChartData(res);
    })()
  }, [market, interval])

  if (!chartData) {
    return <Skeleton className="w-full" />;
  }

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) =>
              xAxisLabelMode === "date"
                ? formatXAxisDate(Number(value))
                : formatXAxisTime(Number(value))
            }
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            domain={[0, 1]}
            orientation="right"
            tickFormatter={(value) => `${value * 100}%`}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => formatDateTime(Number(value))}
                formatter={(value: any) => `${(value as number) * 100}%`}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="probability"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-3">
          <div className="text-white">π {(market.volume ?? 0).toLocaleString()} Vol.</div>
          <div className="hidden md:flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <div className="text-gray-400">{formatDate(market.end_date, "PP")}</div>
          </div>
        </div>

        <div className="flex items-center rounded-md border border-border/60 bg-background/40 p-0.5">
          {INTERVAL_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                interval === value
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "./ui/chart"
import { Skeleton } from "./ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { apiFetch } from "@/lib/api"
import { Market } from "@/lib/types"

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

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

async function loadPriceHistory(market_id: string): Promise<PriceHistoryPoint[]> {
  const params = new URLSearchParams({
    market_id,
    interval: "1m",
  });
  const res = await apiFetch(`/markets/prices-history?${params.toString()}`, {
    method: "GET",
  });

  return (res?.data ?? []).map((item: any) => ({
    timestamp: Number(item.timestamp),
    probability: Number(item.probability),
  }));
}


export function PriceHistoryChart({ market }: PriceHistoryChartProps) {
  const [chartData, setChartData] = useState<PriceHistoryPoint[] | null>(null)

  useEffect(() => {
    if (!market) return;
    (async () => {
      const res = await loadPriceHistory(market.id);
      setChartData(res);
    })()
  }, [market])

  if (!chartData) {
    return <Skeleton className="w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price History</CardTitle>
        <CardDescription>Implied probability of a "YES" outcome over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <ChartContainer config={chartConfig}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatDateTime(Number(value))}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                domain={[0, 1]}
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
              <Area type="monotone" dataKey="probability" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

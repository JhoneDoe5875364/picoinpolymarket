
"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "./ui/chart"
import { Skeleton } from "./ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { apiFetch } from "@/lib/api"
import { Market, PriceHistory } from "@/lib/types"

interface PriceHistoryChartProps {
  market: Market
}

const chartConfig = {
  probability: {
    label: "Probability",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

async function loadPriceHistory(market_id: string): Promise<PriceHistory[]> {
  const res = await apiFetch(`/markets/${market_id}/price-history`, {
    method: "GET",
  });
  return res?.data ?? [];
}


export function PriceHistoryChart({ market }: PriceHistoryChartProps) {
  const [chartData, setChartData] = useState<any[] | null>(null)

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
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
              />
              <Area type="monotone" dataKey="probability" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

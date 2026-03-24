
"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "./ui/chart"
import { format, subDays } from "date-fns"
import { Skeleton } from "./ui/skeleton"

interface PriceHistoryChartProps {
  initialPrice: number
}

const chartConfig = {
  probability: {
    label: "Probability",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// This function generates deterministic data for the chart.
const generateDeterministicData = (initialPrice: number) => {
  const data = [];
  let price = initialPrice;
  // Use a fixed, stable 'now' for generation to ensure consistency
  const now = new Date('2024-01-01T00:00:00Z'); 
  
  // Use a simple, predictable seed for the pseudo-randomness based on the initial price
  let seed = Math.floor(initialPrice * 10000);
  const pseudoRandom = () => {
    // A simple linear congruential generator for deterministic "randomness"
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 30; i >= 0; i--) {
    const date = subDays(now, i);
    // Use a deterministic calculation for price fluctuation
    const fluctuation = (pseudoRandom() - 0.5) * 0.1; // Fluctuate by +/- 5%
    price += fluctuation;
    price = Math.max(0.01, Math.min(0.99, price)); // Clamp between 1% and 99%

    data.push({
      date: format(date, 'MMM d'),
      probability: parseFloat((price * 100).toFixed(1)),
    });
  }
  return data;
};


export function PriceHistoryChart({ initialPrice }: PriceHistoryChartProps) {
  const [chartData, setChartData] = useState<any[] | null>(null)
  
  useEffect(() => {
    // Generate the data on the client side after mount to avoid hydration mismatch.
    setChartData(generateDeterministicData(initialPrice));
  }, [initialPrice])

  if (!chartData) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={chartConfig}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
  )
}

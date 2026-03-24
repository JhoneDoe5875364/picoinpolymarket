"use client";

import * as React from "react";
import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Pt = { t: string; p: number; y: number; n: number };

export default function PriceHistoryChart({ marketId }: { marketId: string }) {
  const { data, isLoading } = useSWR<{ ok: boolean; data: Pt[] }>(
    `/api/markets/${marketId}/history`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Normalize rows for Recharts
  const rows = (data?.data ?? []).map((d: Pt) => ({
    time: new Date(d.t),
    pct: Math.round((d.p ?? 0.5) * 100),
  }));

  // Fallback: single 50% point when there’s no history
  const series = rows.length ? rows : [{ time: new Date(), pct: 50 }];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
          <XAxis
            dataKey="time"
            tickFormatter={(t) =>
              new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            }
            tick={{ fontSize: 12 }}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(t) => new Date(t as any).toLocaleString()}
            formatter={(v) => [`${v}%`, "Yes prob"]}
          />
          <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!isLoading}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

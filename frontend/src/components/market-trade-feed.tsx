// src/components/market-trade-feed.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Market } from "@/lib/types";

type Trade = {
  id: string;
  user_handle?: string;
  side: "yes" | "no";
  amount: number;
  created_at: string;
};

type Props = {
  market: Market;
};

export function MarketTradeFeed({ market }: Props) {
  const [rows, setRows] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await api<any>(`/markets/${market.id}/positions?limit=20`);
        const list: Trade[] = Array.isArray(data)
          ? data
          : data?.items || data?.positions || [];
        if (mounted) setRows(list ?? []);
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (market?.id) load();
    return () => {
      mounted = false;
    };
  }, [market?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent trades.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {t.user_handle || "Trader"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {t.side.toUpperCase()} • {t.amount} π
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

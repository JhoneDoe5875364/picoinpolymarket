"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { Market, Trade } from "@/lib/types";
import { useEffect, useState } from "react";


async function loadRecentTrades(market_id: string): Promise<Trade[]> {
  const res = await apiFetch(`/markets/${market_id}/recent-trades`, {
      method: "GET",
  });
  return res?.data ?? [];
}


export default function RecentTrades({ market }: { market: Market }) {
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])

  useEffect(() => {
    if (!market) return;
    (async () => {
        const res = await loadRecentTrades(market.id);
        setRecentTrades(res);
    })()
}, [market])


return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentTrades.length === 0 ? (
          <div className="text-sm text-muted-foreground">No trades yet.</div>
        ) : (
          <ul className="space-y-2">
            {recentTrades.map((r) => (
              <li key={r.id} className="py-2 text-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={
                      r.side === "yes"
                        ? "border-pink-400 text-pink-300"
                        : "border-cyan-400 text-cyan-300"
                    }
                  >
                    {r.side.toUpperCase()}
                  </Badge>
                  <span className="opacity-80">{(r.pi_amount ?? 0).toLocaleString()} π</span>
                  <span className="opacity-80">{r.pi_username}</span>
                </div>
                <div className="opacity-60">
                  {new Date(r.created_at).toISOString().split("T")[0]}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

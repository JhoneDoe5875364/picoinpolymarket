"use client";

import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { Market, Trade } from "@/lib/types";
import { useEffect, useState } from "react";


async function loadRecentTrades(market_id: number): Promise<Trade[]> {
  const params = new URLSearchParams(
    {
      market_id: market_id.toString(),
      offset: "0",
      limit: "20",
      order: "created_at",
      ascending: false.toString(),
    }
  );
  const res = await apiFetch(`/markets/trades?${params.toString()}`, {
    method: "GET",
  });
  return res?.data ?? [];
}


export default function RecentTrades({ market }: { market: Market }) {
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])

  useEffect(() => {
    if (!market?.id) {
      setRecentTrades([]);
      return;
    }
    
    (async () => {
      const res = await loadRecentTrades(market.id);
      setRecentTrades(res);
    })()
  }, [market?.id])


  return (
    <div className="space-y-2">
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
    </div>
  );
}

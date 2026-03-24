"use client";

import MarketCard from "@/components/MarketCard";
import { apiFetch } from "@/lib/api";
import { Market } from "@/lib/types";
import { useEffect, useState } from "react";

async function loadMarkets(limit: number): Promise<Market[]> {
  const res = await apiFetch(`/markets`, {
    method: "GET",
  });
  return res?.data ?? [];
}

export default function MarketList({ limit = 18 }: { limit?: number }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarkets = async () => {
    try {
      const data = await loadMarkets(limit);
      setMarkets(data);
    } catch (error) {
      console.error("Failed to fetch markets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [limit]);

  if (loading) {
    return (
      <section className="mx-auto max-w-[1200px] px-0 sm:px-0">
        <div className="ppx-markets-grid">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1200px] px-0 sm:px-0">
      <div className="ppx-markets-grid">
        {markets.map((m: any) => (
          <MarketCard key={m.id || m.market_id} market={m} />
        ))}
      </div>
    </section>
  );
}

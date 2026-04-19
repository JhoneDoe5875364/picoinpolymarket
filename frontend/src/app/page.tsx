"use client";

import MarketCard from "@/components/market/MarketCard";
import { apiFetch } from "@/lib/api";
import type { Market } from "@/lib/types";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

async function loadMarkets(limit: number): Promise<Market[]> {
  const res = await apiFetch(`/markets`, {
    method: "GET",
  });
  return (res?.data ?? []).slice(0, limit);
}

export default function Page() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const data = await loadMarkets(18);
        setMarkets(data);
      } catch (error) {
        console.error("Failed to fetch markets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  return (
    <div className="container py-8 px-4 sm:px-8 lg:px-8">
      <section className="mx-auto max-w-[1400px] text-left mb-8 sm:mb-10">
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight">
          Prediction Markets powered by <span className="text-primary">Pi</span>
        </h1>
        <p className="text-white/80 mt-3 sm:mt-4">Browse and forecast on a variety of markets.</p>
        <p className="text-xs text-white/60 mt-1" data-qa="canary">
        </p>
      </section>
      <section className="mx-auto max-w-[1400px] px-0 sm:px-0">
        <div className="ppx-markets-grid">
          {loading
            ? Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-md animate-pulse" />
              ))
            : markets.map((market) => <MarketCard key={market.id} market={market} />)}
        </div>
      </section>
    </div>
  );
}

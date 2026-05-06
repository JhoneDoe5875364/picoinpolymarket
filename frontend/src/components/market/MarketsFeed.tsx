"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MarketCard from "@/components/market/MarketCard";
import { apiFetch } from "@/lib/api";
import type { Market } from "@/lib/types";
import type { MarketDiscoveryKey } from "@/lib/market-categories";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const LOAD_MORE_SKELETON_COUNT = 4;
const MARKETS_GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
const SKELETON_CARD_CLASS = "min-h-36 md:min-h-60 bg-white/5 rounded-md animate-pulse";
const inFlightMarketsRequests = new Map<string, Promise<Market[]>>();
const inFlightSparklineRequests = new Map<number, Promise<number[]>>();
const sparklineCache = new Map<number, number[]>();
const FEATURED_ROTATE_MS = 5000;

type MarketsApiResponse = {
  data?: Market[];
};

type PriceHistoryPoint = {
  probability?: number | string | null;
};

type PriceHistoryApiResponse = {
  data?: PriceHistoryPoint[];
};

function buildMarketsQuery(
  limit: number,
  offset: number,
  selectedCategory: string,
  selectedDiscovery: MarketDiscoveryKey | "default"
): string {
  const query = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    discovery: selectedDiscovery,
    category: selectedCategory.toLowerCase(),
    closed: "false",
    resolved: "false",
  });

  if (selectedDiscovery === "default") {
    query.set("order", "volume");
    query.set("ascending", "false");
  }

  return query.toString();
}

function mergeUniqueMarkets(existing: Market[], incoming: Market[]): Market[] {
  const existingIds = new Set(existing.map((market) => market.id));
  const uniqueIncoming = incoming.filter((market) => !existingIds.has(market.id));
  return [...existing, ...uniqueIncoming];
}

async function fetchMarketsPage(
  limit: number,
  offset: number,
  selectedCategory: string,
  selectedDiscovery: MarketDiscoveryKey | "default"
): Promise<Market[]> {
  const requestKey = `${selectedDiscovery}:${selectedCategory}:${limit}:${offset}`;
  const existingRequest = inFlightMarketsRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = apiFetch<MarketsApiResponse>(
    `/markets?${buildMarketsQuery(limit, offset, selectedCategory, selectedDiscovery)}`,
    {
      method: "GET",
    }
  )
    .then((res) => res?.data ?? [])
    .finally(() => {
      inFlightMarketsRequests.delete(requestKey);
    });

  inFlightMarketsRequests.set(requestKey, request);
  return request;
}

async function fetchMarketSparkline(marketId: number): Promise<number[]> {
  const cached = sparklineCache.get(marketId);
  if (cached) {
    return cached;
  }
  const existingRequest = inFlightSparklineRequests.get(marketId);
  if (existingRequest) {
    return existingRequest;
  }
  const request = apiFetch<PriceHistoryApiResponse>(`/markets/prices-history?market_id=${marketId}&interval=1D`, {
    method: "GET",
  })
    .then((res) => {
      const values = (res?.data ?? [])
        .map((point) => Number(point?.probability))
        .filter((value) => Number.isFinite(value)) as number[];
      const normalized = values.length > 1 ? values : [];
      sparklineCache.set(marketId, normalized);
      return normalized;
    })
    .catch(() => [])
    .finally(() => {
      inFlightSparklineRequests.delete(marketId);
    });
  inFlightSparklineRequests.set(marketId, request);
  return request;
}

function MarketGridSkeleton({ count, prefix }: { count: number; prefix: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`${prefix}-${index}`} className={SKELETON_CARD_CLASS} />
      ))}
    </>
  );
}

interface MarketsFeedProps {
  selectedCategory?: string;
  selectedDiscovery?: MarketDiscoveryKey | "default";
  selectedLabel?: string;
}

export default function MarketsFeed({
  selectedCategory = "All",
  selectedDiscovery = "default",
  selectedLabel,
}: MarketsFeedProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const nextOffsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialMarkets = async () => {
      try {
        setLoading(true);
        setMarkets([]);
        setLoadingMore(false);
        loadingMoreRef.current = false;
        setHasMore(true);
        nextOffsetRef.current = 0;
        const data = await fetchMarketsPage(PAGE_SIZE, 0, selectedCategory, selectedDiscovery);
        if (cancelled) return;

        setMarkets(data);
        setHasMore(data.length === PAGE_SIZE);
        nextOffsetRef.current = data.length;
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to fetch markets:", error);
        setHasMore(false);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    fetchInitialMarkets();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, selectedDiscovery]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadingMoreRef.current) {
          return;
        }

        loadingMoreRef.current = true;
        setLoadingMore(true);
        try {
          const nextMarkets = await fetchMarketsPage(
            PAGE_SIZE,
            nextOffsetRef.current,
            selectedCategory,
            selectedDiscovery
          );
          setMarkets((prev) => mergeUniqueMarkets(prev, nextMarkets));
          nextOffsetRef.current += nextMarkets.length;
          setHasMore(nextMarkets.length === PAGE_SIZE);
        } catch (error) {
          console.error("Failed to fetch more markets:", error);
          setHasMore(false);
        } finally {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loading, loadingMore, selectedCategory, selectedDiscovery]);

  useEffect(() => {
    let cancelled = false;
    const targetMarkets = markets.slice(0, 12);
    if (targetMarkets.length === 0) {
      return;
    }
    const loadSparklines = async () => {
      const results = await Promise.all(
        targetMarkets.map(async (market) => ({
          id: market.id,
          sparkline: await fetchMarketSparkline(market.id),
        }))
      );
      if (cancelled) {
        return;
      }
      setMarkets((prev) =>
        prev.map((market) => {
          const found = results.find((item) => item.id === market.id);
          return found && found.sparkline.length > 1
            ? { ...market, sparkline: found.sparkline }
            : market;
        })
      );
    };
    void loadSparklines();
    return () => {
      cancelled = true;
    };
  }, [markets.length, selectedCategory, selectedDiscovery]);

  const featuredMarkets = markets.filter((market) => (market.featured_rank ?? 99) <= 5);
  useEffect(() => {
    setFeaturedIndex(0);
  }, [selectedCategory, selectedDiscovery]);
  useEffect(() => {
    if (featuredMarkets.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredMarkets.length);
    }, FEATURED_ROTATE_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [featuredMarkets.length]);

  const selectedTitle = selectedLabel ?? (selectedCategory === "All" ? "All Markets" : selectedCategory);
  const featuredMarket = featuredMarkets[featuredIndex] ?? null;

  return (
    <div className="container py-4 px-4 sm:px-8 lg:px-8">
      <section className="mx-auto max-w-[1400px] text-left mb-2 sm:mb-4">
        {/* <h1 className="font-headline text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight">
          Prediction Markets powered by <span className="text-primary">Pi</span>
        </h1>
        <p className="text-white/80 mt-3 sm:mt-4">Browse and forecast on a variety of markets.</p>*/}
        <p className="text-md text-muted-foreground mt-2">
          <span className="text-foreground font-semibold">{selectedTitle}</span>
        </p>
      </section>
      <section className="mx-auto max-w-[1400px] px-0 sm:px-0">
        {!loading && featuredMarket && (
          <Link
            href={`/markets/${featuredMarket.id}`}
            className={cn(
              "mb-4 block rounded-md border border-border bg-card/70 p-4 transition-colors hover:bg-card"
            )}
          >
            <p className="text-xs uppercase tracking-wide text-primary">Featured Market</p>
            <h2 className="mt-1 line-clamp-1 text-base font-semibold text-foreground">{featuredMarket.question}</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {featuredMarket.labels?.join(" · ") || "Active market"} · 24h trades {featuredMarket.trades_24h ?? 0}
            </p>
          </Link>
        )}
        <div className={MARKETS_GRID_CLASS}>
          {loading
            ? <MarketGridSkeleton count={PAGE_SIZE} prefix="initial-loading" />
            : markets.map((market) => <MarketCard key={market.id} market={market} />)}
        </div>
        {!loading && markets.length === 0 && (
          <div className="rounded-md border border-border bg-card/60 px-4 py-5 text-sm text-muted-foreground">
            No markets found in this category yet.
          </div>
        )}
        {loadingMore && (
          <div className={`${MARKETS_GRID_CLASS} mt-4`}>
            <MarketGridSkeleton count={LOAD_MORE_SKELETON_COUNT} prefix="load-more" />
          </div>
        )}
        {hasMore && !loading && <div ref={sentinelRef} className="h-6" aria-hidden="true" />}
      </section>
    </div>
  );
}

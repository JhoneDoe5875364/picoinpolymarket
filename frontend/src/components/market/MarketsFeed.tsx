"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Star } from "lucide-react";
import MarketCard from "@/components/market/MarketCard";
import FeaturedMarketCard from "@/components/market/FeaturedMarketCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, apiFetchWithToken } from "@/lib/api";
import { getPpxToken, useAuth } from "@/context/AuthContext";
import type { Market } from "@/lib/types";
import type { MarketDiscoveryKey } from "@/lib/market-categories";

const PAGE_SIZE = 20;
const LOAD_MORE_SKELETON_COUNT = 4;
const MARKETS_GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
const SKELETON_CARD_CLASS = "min-h-36 md:min-h-60 bg-white/5 rounded-md animate-pulse";
const inFlightMarketsRequests = new Map<string, Promise<Market[]>>();
const inFlightFeaturedMarketsRequests = new Map<string, Promise<Market[]>>();
const FEATURED_ROTATE_MS = 5000;

type MarketsApiResponse = {
  data?: Market[];
};

async function fetchMarketsApi<T = MarketsApiResponse>(path: string): Promise<T> {
  const token = getPpxToken();
  if (token) {
    return apiFetchWithToken<T>(path, { method: "GET" });
  }
  return apiFetch<T>(path, { method: "GET" });
}

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

  const request = fetchMarketsApi<MarketsApiResponse>(
    `/markets?${buildMarketsQuery(limit, offset, selectedCategory, selectedDiscovery)}`
  )
    .then((res) => res?.data ?? [])
    .finally(() => {
      inFlightMarketsRequests.delete(requestKey);
    });

  inFlightMarketsRequests.set(requestKey, request);
  return request;
}

async function fetchFeaturedMarkets(
): Promise<Market[]> {
  const requestKey = "featured";
  const existingRequest = inFlightFeaturedMarketsRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const query = new URLSearchParams({ limit: "5" });

  const request = fetchMarketsApi<MarketsApiResponse>(`/markets/featured?${query.toString()}`)
    .then((res) => res?.data ?? [])
    .finally(() => {
      inFlightFeaturedMarketsRequests.delete(requestKey);
    });

  inFlightFeaturedMarketsRequests.set(requestKey, request);
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
  const { ppxToken } = useAuth();
  const isTrendingPage = selectedDiscovery === "trending";
  const isWatchlistPage = selectedDiscovery === "watchlist";
  const [markets, setMarkets] = useState<Market[]>([]);
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([]);
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

        if (selectedDiscovery === "watchlist" && !ppxToken) {
          setMarkets([]);
          setHasMore(false);
          return;
        }

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
  }, [selectedCategory, selectedDiscovery, ppxToken]);

  useEffect(() => {
    let cancelled = false;
    if (!isTrendingPage) {
      setFeaturedMarkets([]);
      return;
    }
    const loadFeaturedMarkets = async () => {
      try {
        const rows = await fetchFeaturedMarkets();
        if (!cancelled) {
          setFeaturedMarkets(rows);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch featured markets:", error);
          setFeaturedMarkets([]);
        }
      }
    };
    void loadFeaturedMarkets();
    return () => {
      cancelled = true;
    };
  }, [isTrendingPage]);

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
  }, [hasMore, loading, loadingMore, selectedCategory, selectedDiscovery, ppxToken]);

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
        <p className="text-md text-muted-foreground mt-2">
          <span className="text-foreground font-semibold">{selectedTitle}</span>
        </p>
      </section>
      <section className="mx-auto max-w-[1400px] px-0 sm:px-0">
        {!loading && isTrendingPage && featuredMarket && (
          <FeaturedMarketCard market={featuredMarket} />
        )}
        <div className={MARKETS_GRID_CLASS}>
          {loading
            ? <MarketGridSkeleton count={PAGE_SIZE} prefix="initial-loading" />
            : markets.map((market) => <MarketCard key={market.id} market={market} />)}
        </div>
        {!loading && markets.length === 0 && (
          <EmptyState
            icon={isWatchlistPage ? Star : LayoutGrid}
            title={
              isWatchlistPage && !ppxToken
                ? "Log in to build your watchlist"
                : isWatchlistPage
                  ? "Your watchlist is empty"
                  : "No open markets here yet"
            }
            description={
              isWatchlistPage && !ppxToken
                ? "Log in to save markets and view your watchlist."
                : isWatchlistPage
                  ? "Tap the star on any market card to save it here."
                  : "No market in this category is open for predictions right now. Browse the other categories, or check back after the next batch opens."
            }
            action={
              isWatchlistPage ? undefined : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/all">Browse all markets</Link>
                </Button>
              )
            }
          />
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

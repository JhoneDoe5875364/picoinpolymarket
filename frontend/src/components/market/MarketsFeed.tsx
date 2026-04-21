"use client";

import { useEffect, useRef, useState } from "react";
import MarketCard from "@/components/market/MarketCard";
import { apiFetch } from "@/lib/api";
import type { Market } from "@/lib/types";

const PAGE_SIZE = 20;
const LOAD_MORE_SKELETON_COUNT = 4;
const MARKETS_GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
const SKELETON_CARD_CLASS = "min-h-36 md:min-h-60 bg-white/5 rounded-md animate-pulse";
const inFlightMarketsRequests = new Map<string, Promise<Market[]>>();

type MarketsApiResponse = {
  data?: Market[];
};

function buildMarketsQuery(limit: number, offset: number, selectedCategory: string): string {
  const query = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    order: "volume",
    ascending: "false",
    category: selectedCategory.toLowerCase(),
  });
  return query.toString();
}

function mergeUniqueMarkets(existing: Market[], incoming: Market[]): Market[] {
  const existingIds = new Set(existing.map((market) => market.id));
  const uniqueIncoming = incoming.filter((market) => !existingIds.has(market.id));
  return [...existing, ...uniqueIncoming];
}

async function fetchMarketsPage(limit: number, offset: number, selectedCategory: string): Promise<Market[]> {
  const requestKey = `${selectedCategory}:${limit}:${offset}`;
  const existingRequest = inFlightMarketsRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = apiFetch<MarketsApiResponse>(`/markets?${buildMarketsQuery(limit, offset, selectedCategory)}`, {
    method: "GET",
  })
    .then((res) => res?.data ?? [])
    .finally(() => {
      inFlightMarketsRequests.delete(requestKey);
    });

  inFlightMarketsRequests.set(requestKey, request);
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
}

export default function MarketsFeed({ selectedCategory = "All" }: MarketsFeedProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
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
        const data = await fetchMarketsPage(PAGE_SIZE, 0, selectedCategory);
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
  }, [selectedCategory]);

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
          const nextMarkets = await fetchMarketsPage(PAGE_SIZE, nextOffsetRef.current, selectedCategory);
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
  }, [hasMore, loading, loadingMore, selectedCategory]);

  return (
    <div className="container py-4 px-4 sm:px-8 lg:px-8">
      <section className="mx-auto max-w-[1400px] text-left mb-2 sm:mb-4">
        {/* <h1 className="font-headline text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight">
          Prediction Markets powered by <span className="text-primary">Pi</span>
        </h1>
        <p className="text-white/80 mt-3 sm:mt-4">Browse and forecast on a variety of markets.</p>*/}
        <p className="text-md text-muted-foreground mt-2">
          <span className="text-foreground font-semibold">{selectedCategory === "All" ? "All Markets" : selectedCategory}</span>
        </p>
      </section>
      <section className="mx-auto max-w-[1400px] px-0 sm:px-0">
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

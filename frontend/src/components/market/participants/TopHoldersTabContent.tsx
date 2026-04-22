import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Market } from "@/lib/types";
import { ListSkeleton, normalizeNumber, RankedAvatar } from "./shared";
import type { MarketHolder, MarketHolderGroup } from "./types";

const PAGE_SIZE = 20;

interface TopHoldersTabContentProps {
  market: Market;
  isActive: boolean;
}

function HolderColumn({
  title,
  rows,
  valueClassName,
  withDivider = false,
}: {
  title: string;
  rows: MarketHolder[];
  valueClassName: string;
  withDivider?: boolean;
}) {
  return (
    <div className={`space-y-3 ${withDivider ? "border-l border-border pl-4" : ""}`}>
      <h4 className="border-b border-border pb-3 text-sm font-semibold tracking-tight text-foreground/90">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No holders</p>
      ) : (
        <ul className="space-y-2 pt-2">
          {rows.map((holder, idx) => {
            const username = holder.pi_username || "";
            return (
              <li key={`${holder.user_id}-${idx}`} className="flex items-start gap-2">
                <RankedAvatar name={username} rank={idx + 1} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium">{username}</p>
                  <p className={`text-[12px] font-semibold ${valueClassName}`}>
                    {normalizeNumber(holder.shares).toLocaleString()} shares
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function mergeUniqueHolders(existing: MarketHolder[], incoming: MarketHolder[]): MarketHolder[] {
  const seen = new Set(existing.map((holder) => `${holder.user_id}`));
  const uniqueIncoming = incoming.filter((holder) => !seen.has(`${holder.user_id}`));
  return [...existing, ...uniqueIncoming];
}

function getHoldersByOutcome(groups: MarketHolderGroup[], market: Market, outcome: "YES" | "NO"): MarketHolder[] {
  const token = outcome === "YES" ? market.token_yes : market.token_no;
  const byOutcome = groups.find((item) => item.outcome === outcome);
  if (byOutcome) return byOutcome.holders ?? [];
  const byToken = groups.find((item) => item.token === token);
  return byToken?.holders ?? [];
}

export function TopHoldersTabContent({ market, isActive }: TopHoldersTabContentProps) {
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [yesHolders, setYesHolders] = useState<MarketHolder[]>([]);
  const [noHolders, setNoHolders] = useState<MarketHolder[]>([]);
  const nextOffsetRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActive) return;
    if (!market?.id) {
      setYesHolders([]);
      setNoHolders([]);
      setHasMore(false);
      setHoldersLoading(false);
      return;
    }

    let cancelled = false;

    async function loadInitialHolders() {
      setHoldersLoading(true);
      setLoadingMore(false);
      setHasMore(true);
      setYesHolders([]);
      setNoHolders([]);
      nextOffsetRef.current = 0;

      try {
        const params = new URLSearchParams({
          market_id: String(market.id),
          limit: String(PAGE_SIZE),
          offset: "0",
          min_balance: "1",
        });
        const response = await apiFetch<{ data?: MarketHolderGroup[] }>(`/markets/holders?${params.toString()}`);
        if (cancelled) return;

        const groups = response?.data ?? [];
        const yes = getHoldersByOutcome(groups, market, "YES");
        const no = getHoldersByOutcome(groups, market, "NO");
        setYesHolders(yes);
        setNoHolders(no);
        nextOffsetRef.current = PAGE_SIZE;
        setHasMore(yes.length === PAGE_SIZE || no.length === PAGE_SIZE);
      } catch {
        if (cancelled) return;
        setYesHolders([]);
        setNoHolders([]);
        setHasMore(false);
      } finally {
        if (!cancelled) setHoldersLoading(false);
      }
    }

    loadInitialHolders();

    return () => {
      cancelled = true;
    };
  }, [isActive, market.id, market.token_no, market.token_yes]);

  useEffect(() => {
    if (!isActive || holdersLoading || loadingMore || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadMoreInFlightRef.current) return;

        loadMoreInFlightRef.current = true;
        setLoadingMore(true);
        try {
          const currentOffset = nextOffsetRef.current;
          const params = new URLSearchParams({
            market_id: String(market.id),
            limit: String(PAGE_SIZE),
            offset: String(currentOffset),
            min_balance: "1",
          });
          const response = await apiFetch<{ data?: MarketHolderGroup[] }>(`/markets/holders?${params.toString()}`);
          const groups = response?.data ?? [];
          const yes = getHoldersByOutcome(groups, market, "YES");
          const no = getHoldersByOutcome(groups, market, "NO");

          setYesHolders((prev) => mergeUniqueHolders(prev, yes));
          setNoHolders((prev) => mergeUniqueHolders(prev, no));
          nextOffsetRef.current += PAGE_SIZE;
          setHasMore(yes.length === PAGE_SIZE || no.length === PAGE_SIZE);
        } catch {
          setHasMore(false);
        } finally {
          loadMoreInFlightRef.current = false;
          setLoadingMore(false);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [hasMore, holdersLoading, isActive, loadingMore, market.id, market.token_no, market.token_yes]);

  if (holdersLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <ListSkeleton />
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <HolderColumn title="Yes holders" rows={yesHolders} valueClassName="text-emerald-400" />
        <HolderColumn title="No holders" rows={noHolders} valueClassName="text-rose-400" withDivider />
      </div>
      {hasMore ? <div ref={sentinelRef} className="h-6" aria-hidden="true" /> : null}
      {loadingMore ? <p className="text-center text-sm text-muted-foreground">Loading more holders...</p> : null}
    </div>
  );
}

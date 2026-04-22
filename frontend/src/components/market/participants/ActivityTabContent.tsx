import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Market } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  InitialAvatar,
  ListSkeleton,
  normalizeNumber,
  outcomeColor,
  outcomeText,
} from "./shared";
import type { MarketTradeActivity, MinAmountFilter } from "./types";
import { formatRelativeTime, toUnsignedMoney } from "@/lib/utils";

const PAGE_SIZE = 20;

interface ActivityTabContentProps {
  market: Market;
  isActive: boolean;
}

export function ActivityTabContent({
  market,
  isActive,
}: ActivityTabContentProps) {
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityLoadingMore, setActivityLoadingMore] = useState(false);
  const [minAmount, setMinAmount] = useState<MinAmountFilter>("NONE");
  const [activityRows, setActivityRows] = useState<MarketTradeActivity[]>([]);
  const [hasMoreActivity, setHasMoreActivity] = useState(true);
  const nextOffsetRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  function buildTradesParams(offset: number): URLSearchParams {
    const params = new URLSearchParams({
      market_id: String(market.id),
      offset: String(offset),
      limit: String(PAGE_SIZE),
      order: "created_at",
      ascending: "false",
    });
    if (minAmount !== "NONE") {
      params.set("min_amount", minAmount);
    }
    return params;
  }

  useEffect(() => {
    if (!isActive) return;
    if (!market?.id) {
      setActivityRows([]);
      setActivityLoading(false);
      setHasMoreActivity(false);
      return;
    }

    let cancelled = false;

    async function loadInitialActivity() {
      setActivityLoading(true);
      setActivityLoadingMore(false);
      setHasMoreActivity(true);
      setActivityRows([]);
      nextOffsetRef.current = 0;

      try {
        const params = buildTradesParams(0);
        const response = await apiFetch<{ data?: MarketTradeActivity[] }>(`/markets/trades?${params.toString()}`);
        if (cancelled) return;

        const rows = response?.data ?? [];
        setActivityRows(rows);
        setHasMoreActivity(rows.length === PAGE_SIZE);
        nextOffsetRef.current = PAGE_SIZE;
      } catch {
        if (cancelled) return;
        setActivityRows([]);
        setHasMoreActivity(false);
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    }

    loadInitialActivity();
    return () => {
      cancelled = true;
    };
  }, [isActive, market.id, minAmount]);

  useEffect(() => {
    if (!isActive || activityLoading || activityLoadingMore || !hasMoreActivity) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadMoreInFlightRef.current) return;

        loadMoreInFlightRef.current = true;
        setActivityLoadingMore(true);
        try {
          const currentOffset = nextOffsetRef.current;
          const params = buildTradesParams(currentOffset);
          const response = await apiFetch<{ data?: MarketTradeActivity[] }>(`/markets/trades?${params.toString()}`);
          const rows = response?.data ?? [];
          setActivityRows((prev) => [...prev, ...rows]);
          nextOffsetRef.current += PAGE_SIZE;
          setHasMoreActivity(rows.length === PAGE_SIZE);
        } catch {
          setHasMoreActivity(false);
        } finally {
          loadMoreInFlightRef.current = false;
          setActivityLoadingMore(false);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [activityLoading, activityLoadingMore, hasMoreActivity, isActive, market.id, minAmount]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={minAmount} onValueChange={(value) => setMinAmount(value as MinAmountFilter)}>
          <SelectTrigger className="h-9 w-[140px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            <SelectItem value="10">10π</SelectItem>
            <SelectItem value="100">100π</SelectItem>
            <SelectItem value="1000">1,000π</SelectItem>
            <SelectItem value="10000">10,000π</SelectItem>
            <SelectItem value="100000">100,000π</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activityLoading ? (
        <ListSkeleton />
      ) : activityRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {activityRows.map((row, idx) => {
            const name = row.taker_pi_username || "";
            const shares = normalizeNumber(row.shares);
            const price = normalizeNumber(row.price);
            const piAmount = normalizeNumber(row.pi_amount);
            const outcome = String(row.outcome || "").toUpperCase() === "YES" ? "Yes" : "No";
            return (
              <li key={`${row.id}-${idx}`} className="flex items-start items-center justify-between gap-1 py-2">
                <div className="flex min-w-0 items-center gap-1">
                  <InitialAvatar name={name} size="sm" />
                  <p className="truncate text-[12px] text-foreground/90">
                    <span className="font-semibold">{name}</span>{" "}
                    <span className="text-muted-foreground">{outcomeText(row.outcome)}</span>{" "}
                    <span className={outcomeColor(row.outcome)}>{shares.toLocaleString()} {outcome}</span>{" "}
                    <span className="text-muted-foreground">at</span>{" "}
                    <span className="font-semibold">{toUnsignedMoney(price)}</span>{" "}
                    <span className="text-muted-foreground">({toUnsignedMoney(piAmount)})</span>
                  </p>
                </div>
                <p className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  {formatRelativeTime(row.created_at)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {hasMoreActivity && !activityLoading ? <div ref={sentinelRef} className="h-6" aria-hidden="true" /> : null}
      {activityLoadingMore ? <p className="text-center text-sm text-muted-foreground">Loading more activity...</p> : null}
    </div>
  );
}

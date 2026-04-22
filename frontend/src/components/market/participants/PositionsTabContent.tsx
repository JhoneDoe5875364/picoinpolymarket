import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Market } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListSkeleton, normalizeNumber, RankedAvatar } from "./shared";
import type { MarketPosition, MarketPositionGroup, PositionStatus, SortDirection } from "./types";
import { toUnsignedMoney } from "@/lib/utils";

const PAGE_SIZE = 20;
const inFlightPositionsRequests = new Map<string, Promise<MarketPositionGroup>>();

interface PositionsTabContentProps {
  market: Market;
  isActive: boolean;
}

function PositionColumn({
  title,
  rows,
  valueClassName,
  keyPrefix,
  withDivider = false,
}: {
  title: string;
  rows: MarketPosition[];
  valueClassName: string;
  keyPrefix: string;
  withDivider?: boolean;
}) {
  return (
    <div className={`${withDivider ? "border-l border-border pl-4" : ""}`}>
      <h4 className="border-b border-border pb-3 text-sm font-semibold tracking-tight text-foreground/90">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No positions found.</p>
      ) : (
        <ul>
          {rows.map((position, idx) => {
            const username = position.pi_username || "";
            const piAmount = normalizeNumber(position.pi_amount);
            const shares = normalizeNumber(position.shares);
            const avgPrice = piAmount / Math.max(shares, 1);

            return (
              <li key={`${position.id}-${keyPrefix}-${idx}`} className="flex items-start gap-1 border-b border-border py-2">
                <RankedAvatar name={username} rank={idx + 1} size="sm" />
                <div className="md:hidden">
                  <div className="flex items-baseline gap-1">
                    <p className="truncate text-[12px] font-medium">{username}</p>
                    <p className="shrink-0 text-[10px] text-muted-foreground">avg {toUnsignedMoney(avgPrice)}</p>
                  </div>
                  <p className={`text-[12px] font-semibold ${valueClassName}`}>{toUnsignedMoney(piAmount)}</p>
                  <p className="text-[11px] text-muted-foreground">{shares.toLocaleString()} shares</p>
                </div>
                <div className="hidden md:flex w-full items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <p className="truncate text-[12px] font-medium">{username}</p>
                    <p className="shrink-0 text-[10px] text-muted-foreground">avg {toUnsignedMoney(avgPrice)}</p>
                  </div>
                  <p className={`text-[12px] font-semibold ${valueClassName}`}>{toUnsignedMoney(piAmount)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function mergeUniquePositions(existing: MarketPosition[], incoming: MarketPosition[]): MarketPosition[] {
  const seen = new Set(existing.map((row) => `${row.id}`));
  const uniqueIncoming = incoming.filter((row) => !seen.has(`${row.id}`));
  return [...existing, ...uniqueIncoming];
}

function buildPositionsParams(args: {
  marketId: number | string;
  positionStatus: PositionStatus;
  sortDirection: SortDirection;
  offset: number;
}): URLSearchParams {
  return new URLSearchParams({
    market_id: String(args.marketId),
    status: args.positionStatus,
    limit: String(PAGE_SIZE),
    offset: String(args.offset),
    order: "shares",
    ascending: String(args.sortDirection === "ASC"),
  });
}

async function fetchPositionsPage(args: {
  marketId: number | string;
  positionStatus: PositionStatus;
  sortDirection: SortDirection;
  offset: number;
}): Promise<MarketPositionGroup> {
  const params = buildPositionsParams(args);
  const requestKey = params.toString();
  const existingRequest = inFlightPositionsRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = apiFetch<{ data?: MarketPositionGroup }>(`/markets/positions?${requestKey}`)
    .then((response) => response?.data ?? { YES: [], NO: [] })
    .finally(() => {
      inFlightPositionsRequests.delete(requestKey);
    });

  inFlightPositionsRequests.set(requestKey, request);
  return request;
}

export function PositionsTabContent({
  market,
  isActive,
}: PositionsTabContentProps) {
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsLoadingMore, setPositionsLoadingMore] = useState(false);
  const [hasMorePositions, setHasMorePositions] = useState(true);
  const [yesPositions, setYesPositions] = useState<MarketPosition[]>([]);
  const [noPositions, setNoPositions] = useState<MarketPosition[]>([]);
  const [positionStatus, setPositionStatus] = useState<PositionStatus>("ALL");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const nextOffsetRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActive) return;
    if (!market?.id) {
      setPositionsLoading(false);
      setHasMorePositions(false);
      setYesPositions([]);
      setNoPositions([]);
      return;
    }

    let cancelled = false;

    async function loadInitialPositions() {
      setPositionsLoading(true);
      setPositionsLoadingMore(false);
      setHasMorePositions(true);
      setYesPositions([]);
      setNoPositions([]);
      nextOffsetRef.current = 0;

      try {
        const groups = await fetchPositionsPage({
          marketId: market.id,
          positionStatus,
          sortDirection,
          offset: 0,
        });
        if (cancelled) return;

        setYesPositions(groups.YES ?? []);
        setNoPositions(groups.NO ?? []);
        nextOffsetRef.current = PAGE_SIZE;
        setHasMorePositions((groups.YES?.length ?? 0) === PAGE_SIZE || (groups.NO?.length ?? 0) === PAGE_SIZE);
      } catch {
        if (cancelled) return;
        setYesPositions([]);
        setNoPositions([]);
        setHasMorePositions(false);
      } finally {
        if (!cancelled) setPositionsLoading(false);
      }
    }

    loadInitialPositions();
    return () => {
      cancelled = true;
    };
  }, [isActive, market.id, positionStatus, sortDirection]);

  useEffect(() => {
    if (!isActive || positionsLoading || positionsLoadingMore || !hasMorePositions) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadMoreInFlightRef.current) return;

        loadMoreInFlightRef.current = true;
        setPositionsLoadingMore(true);
        try {
          const currentOffset = nextOffsetRef.current;
          const groups = await fetchPositionsPage({
            marketId: market.id,
            positionStatus,
            sortDirection,
            offset: currentOffset,
          });
          const nextYes = groups.YES ?? [];
          const nextNo = groups.NO ?? [];

          setYesPositions((prev) => mergeUniquePositions(prev, nextYes));
          setNoPositions((prev) => mergeUniquePositions(prev, nextNo));
          nextOffsetRef.current += PAGE_SIZE;
          setHasMorePositions(nextYes.length === PAGE_SIZE || nextNo.length === PAGE_SIZE);
        } catch {
          setHasMorePositions(false);
        } finally {
          loadMoreInFlightRef.current = false;
          setPositionsLoadingMore(false);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [hasMorePositions, isActive, market.id, positionStatus, positionsLoading, positionsLoadingMore, sortDirection]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select value={positionStatus} onValueChange={(value) => setPositionStatus(value as PositionStatus)}>
          <SelectTrigger className="h-9 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as SortDirection)}>
          <SelectTrigger className="h-9 w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DESC">Desc</SelectItem>
            <SelectItem value="ASC">Asc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {positionsLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <ListSkeleton />
          <ListSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <PositionColumn title="Yes" rows={yesPositions} valueClassName="text-emerald-400" keyPrefix="YES" />
          <PositionColumn title="No" rows={noPositions} valueClassName="text-rose-400" keyPrefix="NO" withDivider />
        </div>
      )}
      {hasMorePositions && !positionsLoading ? <div ref={sentinelRef} className="h-6" aria-hidden="true" /> : null}
      {positionsLoadingMore ? <p className="text-center text-sm text-muted-foreground">Loading more positions...</p> : null}
    </div>
  );
}

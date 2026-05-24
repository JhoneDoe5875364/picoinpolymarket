"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toggleWatchlist } from "@/lib/watchlist";

type WatchlistContextValue = {
  isWatchlisted: (marketId: number, initial?: boolean) => boolean;
  toggle: (marketId: number, initial?: boolean) => Promise<boolean>;
  isPending: (marketId: number) => boolean;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set());

  const isWatchlisted = useCallback(
    (marketId: number, initial = false) => {
      if (Object.prototype.hasOwnProperty.call(overrides, marketId)) {
        return overrides[marketId];
      }
      return initial;
    },
    [overrides]
  );

  const toggle = useCallback(
    async (marketId: number, initial = false) => {
      const prev = isWatchlisted(marketId, initial);
      setPendingIds((current) => new Set(current).add(marketId));
      setOverrides((current) => ({ ...current, [marketId]: !prev }));

      try {
        const watched = await toggleWatchlist(marketId);
        setOverrides((current) => ({ ...current, [marketId]: watched }));
        return watched;
      } catch {
        setOverrides((current) => {
          const next = { ...current };
          if (prev) {
            next[marketId] = true;
          } else {
            delete next[marketId];
          }
          return next;
        });
        throw new Error("Failed to update watchlist");
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(marketId);
          return next;
        });
      }
    },
    [isWatchlisted]
  );

  const isPending = useCallback(
    (marketId: number) => pendingIds.has(marketId),
    [pendingIds]
  );

  const value = useMemo(
    () => ({ isWatchlisted, toggle, isPending }),
    [isWatchlisted, toggle, isPending]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
}

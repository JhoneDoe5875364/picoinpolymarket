"use client";

import { useEffect, useState } from "react";
import { MarketShareButton } from "@/components/market/MarketShareButton";
import { MarketWatchlistButton } from "@/components/market/MarketWatchlistButton";
import { useAuth } from "@/context/AuthContext";
import { apiFetchWithToken } from "@/lib/api";
import type { Market } from "@/lib/types";

type MarketActionsProps = {
  marketId: number;
  title: string;
  watched?: boolean;
};

export function MarketActions({ marketId, title, watched: initialWatched = false }: MarketActionsProps) {
  const { ppxToken } = useAuth();
  const [watched, setWatched] = useState(initialWatched);

  useEffect(() => {
    setWatched(initialWatched);
  }, [initialWatched]);

  useEffect(() => {
    if (!ppxToken) {
      setWatched(false);
      return;
    }

    let cancelled = false;
    void apiFetchWithToken<{ data?: Market }>(`/markets/${marketId}`, { method: "GET" })
      .then((res) => {
        if (!cancelled) {
          setWatched(Boolean(res?.data?.viewer_is_watchlisted));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWatched(initialWatched);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialWatched, marketId, ppxToken]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MarketWatchlistButton marketId={marketId} watched={watched} variant="icon" />
      <MarketShareButton marketId={marketId} title={title} variant="icon" />
    </div>
  );
}

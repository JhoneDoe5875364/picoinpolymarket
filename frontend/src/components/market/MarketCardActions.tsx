"use client";

import { MarketShareButton } from "@/components/market/MarketShareButton";
import { MarketWatchlistButton } from "@/components/market/MarketWatchlistButton";

type MarketCardActionsProps = {
  marketId: number;
  title: string;
  watched?: boolean;
};

function stopNav(event: React.MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function MarketCardActions({ marketId, title, watched }: MarketCardActionsProps) {
  return (
    <div
      className="flex flex-col shrink-0 items-center gap-0.5"
      onClick={stopNav}
    >
      <MarketWatchlistButton
        marketId={marketId}
        watched={watched}
        variant="icon"
        onClick={stopNav}
      />
      <MarketShareButton
        marketId={marketId}
        title={title}
        variant="icon"
        onClick={stopNav}
      />
    </div>
  );
}

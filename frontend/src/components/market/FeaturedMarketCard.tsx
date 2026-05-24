"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { InitialAvatar } from "@/components/market/participants/shared";
import { PriceHistoryChart } from "@/components/market/PriceHistoryChart";
import { MarketCardActions } from "@/components/market/MarketCardActions";
import { cn, roundLocalePi } from "@/lib/utils";
import { fmtShortDate } from "@/lib/dates";
import type { Market } from "@/lib/types";

type MarketComment = {
  id: number;
  body?: string | null;
  pi_username?: string | null;
};

const DEFAULT_MARKET_ICON = "/images/markets/market-default.png";
const FEATURED_PANEL_PC_HEIGHT = "md:h-[168px]";
const FEATURED_COMMENT_ROTATE_MS = 3000;
const FEATURED_COMMENT_ROW_HEIGHT = 48;

function fmtPrice(value: unknown): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0%";
  return `${Math.round(parsed * 100)}%`;
}

function FeaturedCommentsCarousel({
  comments,
  resetKey,
}: {
  comments?: MarketComment[];
  resetKey?: number;
}) {
  const featuredComments = useMemo(
    () =>
      (comments ?? [])
        .filter((item) => typeof item?.body === "string" && item.body.trim().length > 0)
        .map((item) => ({
          id: item.id,
          body: item.body,
          pi_username: item.pi_username,
        })),
    [comments]
  );
  const rollingComments =
    featuredComments.length > 1 ? [...featuredComments, featuredComments[0]] : featuredComments;
  const [featuredCommentIndex, setFeaturedCommentIndex] = useState(0);

  useEffect(() => {
    setFeaturedCommentIndex(0);
  }, [resetKey]);

  useEffect(() => {
    if (featuredComments.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setFeaturedCommentIndex((prev) => (prev + 1) % featuredComments.length);
    }, FEATURED_COMMENT_ROTATE_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [featuredComments.length]);

  return (
    <div className="h-36 md:h-48 overflow-hidden rounded-md border border-border/60 bg-card/40 px-3 py-2">
      {featuredComments.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          No comments yet
        </div>
      ) : (
        <div
          className="transition-transform duration-500 ease-out"
          style={{
            transform: `translateY(-${featuredCommentIndex * FEATURED_COMMENT_ROW_HEIGHT}px)`,
          }}
        >
          {rollingComments.map((comment, index) => {
            const displayName = comment.pi_username?.trim() || "Anonymous";
            return (
              <div
                key={`${comment.id}-${index}`}
                className="flex h-12 items-center gap-2 border-b border-border/40 last:border-b-0"
              >
                <InitialAvatar name={displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-medium text-foreground">{displayName}</p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FeaturedMarketCardProps {
  market: Market;
}

export default function FeaturedMarketCard({ market }: FeaturedMarketCardProps) {
  const featuredYesPrice = market.outcome_price_yes ?? 0.5;
  const featuredNoPrice = market.outcome_price_no ?? 0.5;

  return (
    <div className={cn("mb-4 block rounded-md border border-border bg-card/70 p-4 transition-colors hover:bg-card")}>
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
          <div className="h-full w-full overflow-hidden rounded-md border border-border/60 bg-muted/20">
            <img
              src={market.icon || DEFAULT_MARKET_ICON}
              alt={market.question}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                const target = event.currentTarget;
                if (!target.src.includes(DEFAULT_MARKET_ICON)) {
                  target.src = DEFAULT_MARKET_ICON;
                }
              }}
            />
          </div>
          <MarketCardActions
            marketId={market.id}
            title={market.question}
            watched={Boolean(market.viewer_is_watchlisted)}
          />
        </div>
        <Link href={`/markets/${market.id}`}>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-primary">{market.labels?.length ? market.labels.join(" · ") : "Featured"}</p>
            <h2 className="mt-1 line-clamp-2 text-base font-semibold text-foreground sm:text-lg">{market.question}</h2>
            <div className="flex gap-2 mt-1">
              <span className="btn-yes rounded-md px-2 py-1 text-xs">
                Yes {fmtPrice(featuredYesPrice)}
              </span>
              <span className="btn-no rounded-md px-2 py-1 text-xs">
                No {fmtPrice(featuredNoPrice)}
              </span>
            </div>
          </div>
        </Link>
      </div>
      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-3">
        <div className="min-w-0 overflow-hidden md:col-span-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Price History</p>
          <PriceHistoryChart
            market={market}
            fixedInterval="ALL"
            embedded
            showFooter={false}
            chartClassName="aspect-auto h-32 max-w-full md:h-48 w-full"
          />
        </div>
        <div className="md:col-span-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Live Comments</p>
          <FeaturedCommentsCarousel comments={market.featured_comments} resetKey={market.id} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-2">
          <div>· Volume: <span className="font-semibold">{roundLocalePi(market.volume)}</span></div>
          <div>· 24h Trades: <span className="font-semibold">{market.trades_24h ?? 0}</span></div>
        </div>
        <div className="flex">
          <span>· End Date: {fmtShortDate(market.end_date)}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { InitialAvatar } from "@/components/market/participants/shared";
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

function normalizeSparkline(values?: number[]): number[] {
  if (!Array.isArray(values) || values.length < 2) {
    return [];
  }
  return values.filter((value) => Number.isFinite(value));
}

function FeaturedPriceSparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <div
        className={cn(
          "flex h-28 items-center justify-center rounded-md border border-border/60 bg-card/40 text-xs text-muted-foreground",
          FEATURED_PANEL_PC_HEIGHT
        )}
      >
        Price history unavailable
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-card/40 p-2",
        "xl:flex xl:flex-col",
        FEATURED_PANEL_PC_HEIGHT
      )}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-24 w-full xl:min-h-0 xl:flex-1"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          points={points}
          className="text-primary"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex shrink-0 items-center justify-between text-[11px] text-muted-foreground">
        <span>{Math.round(min * 100)}%</span>
        <span>YES probability</span>
        <span>{Math.round(max * 100)}%</span>
      </div>
    </div>
  );
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
    <div
      className={cn(
        "h-28 overflow-hidden rounded-md border border-border/60 bg-card/40 px-3 py-2",
        FEATURED_PANEL_PC_HEIGHT
      )}
    >
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
  const priceHistorySparkline = useMemo(
    () =>
      (market.price_history ?? [])
        .map((point) => Number(point?.probability))
        .filter((value) => Number.isFinite(value)) as number[],
    [market.price_history]
  );
  const preparedSparkline = useMemo(
    () => normalizeSparkline(market.sparkline?.length ? market.sparkline : priceHistorySparkline),
    [market.sparkline, priceHistorySparkline]
  );
  const displaySparkline = preparedSparkline;

  return (
    <Link
      href={`/markets/${market.id}`}
      className={cn(
        "mb-4 block rounded-md border border-border bg-card/70 p-4 transition-colors hover:bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted/20 sm:h-20 sm:w-20">
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
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Price History</p>
          <FeaturedPriceSparkline values={displaySparkline} />
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
    </Link>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Market } from "@/lib/types";
import { fmtShortDate } from "@/lib/dates";
import MarketProbability from "@/components/market/MarketProbability";
import QuickBuyModal from "@/components/market/QuickBuyModal";
import { MarketCardActions } from "@/components/market/MarketCardActions";
import { cn, roundLocalePi } from "@/lib/utils";
import { TRADE_COPY } from "@/lib/copy/trade";
// -----------------------------------------------------
const DEFAULT_MARKET_ICON = "/images/markets/market-default.png";

function fmtNum(n: unknown, fallback = "0") {
  if (typeof n === "number" && Number.isFinite(n)) return Math.trunc(n).toLocaleString();
  const num = typeof n === "string" ? Number(n) : NaN;
  return Number.isFinite(num) ? Math.trunc(num).toLocaleString() : fallback;
}
function titleOf(m: Market | any) { return m?.question ?? "Untitled market"; }
function iconOf(m: Market | any) {
  return typeof m?.icon === "string" && m.icon.trim().length > 0 ? m.icon : null;
}

function labelColorClass(label: string) {
  switch (label.trim().toLowerCase()) {
    case "new":
      return "border-emerald-300/80 bg-emerald-100 text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-900/40 dark:text-emerald-200";
    case "trending":
      return "border-sky-300/80 bg-sky-100 text-sky-800 dark:border-sky-700/70 dark:bg-sky-900/40 dark:text-sky-200";
    case "hot":
      return "border-rose-300/80 bg-rose-100 text-rose-800 dark:border-rose-700/70 dark:bg-rose-900/40 dark:text-rose-200";
    case "ending soon":
      return "border-amber-300/80 bg-amber-100 text-amber-800 dark:border-amber-700/70 dark:bg-amber-900/40 dark:text-amber-200";
    default:
      return "border-border/60 bg-secondary/70 text-foreground/90";
  }
}

function MoveArrow({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 8 6"
      className={cn("h-2.5 w-2.5 shrink-0", up && "rotate-180")}
      aria-hidden
    >
      <path d="M4 6 0 0h8L4 6z" fill="currentColor" />
    </svg>
  );
}

function PriceMoveBadge({ move }: { move: number }) {
  if (!Number.isFinite(move) || move === 0) {
    return null;
  }
  const isUp = move > 0;
  const pct = Math.abs(Math.round(move * 100));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-semibold",
        isUp ? "text-emerald-500" : "text-red-500"
      )}
    >
      <MoveArrow up={isUp} />
      {pct}%
    </span>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  if (!values || values.length < 2) {
    return null;
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
    <div className="mt-2 h-8 w-full rounded-sm border border-border/60 bg-card/40 px-1 py-1">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          points={points}
          className="text-primary/80"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function MarketCard({ market }: { market: Market | any }) {
  const volume = market?.volume ?? 0;
  const yesPrice = market?.outcome_price_yes ?? 0.5;
  const noPrice = market?.outcome_price_no ?? 0.5;
  const icon = iconOf(market);
  const pathname = usePathname();
  const yesProbability = Math.round(yesPrice * 100);
  const noProbability = Math.round(noPrice * 100);
  const labels = Array.isArray(market?.labels) ? market.labels.slice(0, 4) : [];
  const trades24h = Number(market?.trades_24h ?? 0);
  const comments24h = Number(market?.comments_24h ?? 0);
  const priceMove24h = Number(market?.price_move_24h ?? 0);
  const showTrades = trades24h > 0;
  const showComments = comments24h > 0;
  const showPriceMove = priceMove24h !== 0;
  const showSignals = showTrades || showComments || showPriceMove;

  const [outcome, setOutcome] = React.useState<null | "YES" | "NO">(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isYesHovered, setIsYesHovered] = React.useState(false);
  const [isNoHovered, setIsNoHovered] = React.useState(false);
  const [iconSrc, setIconSrc] = React.useState(icon ?? DEFAULT_MARKET_ICON);

  // If the pathname changes, reset the modal and buy side states
  React.useEffect(() => {
    setModalOpen(false);
    setOutcome(null);
  }, [pathname]);

  // When the component unmounts, reset the modal and buy side states
  React.useEffect(() => {
    return () => {
      setModalOpen(false);
      setOutcome(null);
    };
  }, []);
  React.useEffect(() => {
    setIconSrc(icon ?? DEFAULT_MARKET_ICON);
  }, [icon]);

  function onYes(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setOutcome("YES"); setModalOpen(true); }
  function onNo(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setOutcome("NO"); setModalOpen(true); }

  return (
    <>
      <Link href={`/markets/${market.id}`} className="block">
        <Card>
          <CardContent>
            <div className="mb-3 flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted/20 md:h-16 md:w-16">
                <img
                  src={iconSrc}
                  alt={titleOf(market)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => {
                    if (iconSrc !== DEFAULT_MARKET_ICON) setIconSrc(DEFAULT_MARKET_ICON);
                  }}
                />
              </div>
              <div className="flex min-h-12 min-w-0 flex-1 items-start justify-between gap-2 md:min-h-16">
                <CardTitle className="min-w-0 flex-1 text-[14px] leading-6 line-clamp-2 break-words md:text-[16px] md:leading-snug md:line-clamp-3">
                  {titleOf(market)}
                </CardTitle>
                <MarketCardActions
                  marketId={market.id}
                  title={titleOf(market)}
                  watched={Boolean(market?.viewer_is_watchlisted)}
                />
              </div>
            </div>
            {labels.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {labels.map((label: string) => (
                  <span
                    key={label}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      labelColorClass(label)
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            <MarketProbability implied={yesPrice} />
            <MiniSparkline values={Array.isArray(market?.sparkline) ? market.sparkline : []} />
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                className={cn(
                  "flex h-8 items-center justify-center rounded-md px-4",
                  "cursor-pointer text-sm font-semibold",
                  "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/50 hover:text-white"
                )}
                onClick={onYes}
                onMouseEnter={() => setIsYesHovered(true)}
                onMouseLeave={() => setIsYesHovered(false)}
                aria-label="Buy Yes"
              >
                {isYesHovered ? `${yesProbability}%` : "Yes"}
              </button>
              <button
                className={cn(
                  "flex h-8 items-center justify-center rounded-md px-4",
                  "cursor-pointer text-sm font-semibold",
                  "bg-red-500/20 text-red-600 hover:bg-red-500/50 hover:text-white"
                )}
                onClick={onNo}
                onMouseEnter={() => setIsNoHovered(true)}
                onMouseLeave={() => setIsNoHovered(false)}
                aria-label="Buy No"
              >
                {isNoHovered ? `${noProbability}%` : "No"}
              </button>
            </div>
            {showSignals && (
              <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">
                {showTrades && <span>{TRADE_COPY.predictionsToday(fmtNum(trades24h))}</span>}
                {showTrades && (showComments || showPriceMove) && <span> · </span>}
                {showComments && <span>{fmtNum(comments24h)} comments</span>}
                {showComments && showPriceMove && <span> · </span>}
                {showPriceMove && <PriceMoveBadge move={priceMove24h} />}
              </p>
            )}
            <div className="mt-2 flex justify-between text-xs text-muted-foreground md:mt-4">
              <span>· Volume: <span className="font-semibold">{roundLocalePi(volume)}</span></span>
              <span>· End Date: <span className="font-semibold">{fmtShortDate(market?.end_date)}</span></span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {outcome && (
        <QuickBuyModal
          open={modalOpen}
          marketId={market.id}
          outcome={outcome}
          marketQuestion={titleOf(market)}
          price={outcome === "YES" ? yesPrice : noPrice}
          onClose={() => {
            setModalOpen(false);
            setOutcome(null);
          }}
          onDone={() => {
            setModalOpen(false);
            setOutcome(null);
            try { const r = require("next/navigation"); r?.useRouter?.().refresh?.(); } catch (_) { }
          }}
        />
      )}
    </>
  );
}
export default MarketCard;

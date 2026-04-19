"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Market } from "@/lib/types";
import { fmtShortDate } from "@/lib/dates";
import MarketProbability from "@/components/market/MarketProbability";
import QuickBuyModal from "@/components/trade/QuickBuyModal";
import { cn } from "@/lib/utils";
// -----------------------------------------------------

function fmtNum(n: unknown, fallback = "0") {
  if (typeof n === "number" && Number.isFinite(n)) return n.toLocaleString();
  const num = typeof n === "string" ? Number(n) : NaN;
  return Number.isFinite(num) ? num.toLocaleString() : fallback;
}
function titleOf(m: Market | any) { return m?.question ?? m?.title ?? "Untitled market"; }
function inferYesProb(m: any): number | null {
  if (typeof m?.implied === "number") return m.implied;
  const yes = m?.yes_pct ?? 0;
  const no = m?.no_pct ?? 0;
  if (yes + no > 0) return yes / (yes + no);
  return 0.5;
}

export function MarketCard({ market }: { market: Market | any }) {
  const volume = market?.total_volume ?? 0;
  const implied = inferYesProb(market);
  const yesPrice = market?.yes_price ?? implied ?? 0.5;
  const noPrice = market?.no_price ?? (1 - (implied ?? 0.5));
  const pathname = usePathname();
  const yesProbability = Math.round((implied ?? 0.5) * 100);
  const noProbability = Math.round((1 - (implied ?? 0.5)) * 100);

  const [outcome, setOutcome] = React.useState<null | "YES" | "NO">(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isYesHovered, setIsYesHovered] = React.useState(false);
  const [isNoHovered, setIsNoHovered] = React.useState(false);

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

  function onYes(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setOutcome("YES"); setModalOpen(true); }
  function onNo(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setOutcome("NO"); setModalOpen(true); }

  return (
    <>
      <Link href={`/markets/${market.id}`} className="block">
        <Card>
          <CardContent>
            <CardTitle className="text-lg line-clamp-2 min-h-16">
              {titleOf(market)}
            </CardTitle>

            <MarketProbability implied={implied} />
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                className={cn(
                  "flex h-8 items-center justify-center rounded-md border px-4",
                  "cursor-pointer text-sm font-semibold",
                  "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/50 hover:text-white"
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
                  "flex h-8 items-center justify-center rounded-md border px-4",
                  "cursor-pointer text-sm font-semibold",
                  "bg-red-500/20 text-red-300 hover:bg-red-500/50 hover:text-white"
                )}
                onClick={onNo}
                onMouseEnter={() => setIsNoHovered(true)}
                onMouseLeave={() => setIsNoHovered(false)}
                aria-label="Buy No"
              >
                {isNoHovered ? `${noProbability}%` : "No"}
              </button>
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-2 md:mt-4">
              <span>Volume: <span className="font-semibold">{fmtNum(volume)} π</span></span>
              <span>End Date: {fmtShortDate(market?.end_date)}</span>
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

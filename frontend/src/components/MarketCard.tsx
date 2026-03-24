"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Market } from "@/lib/types";
import { fmtShortDate } from "@/lib/dates";
import MarketProbability from "@/components/MarketProbability";
import QuickBuyModal from "@/components/trade/QuickBuyModal";
import { catCls, statusCls } from "@/lib/utils";
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
  const status: string = (market?.status as string) ?? "open";
  const category: string = market?.category ?? "General";
  const volume = market?.total_volume ?? 0;
  const implied = inferYesProb(market);
  const pathname = usePathname();

  const [buySide, setBuySide] = React.useState<null | "yes" | "no">(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // If the pathname changes, reset the modal and buy side states
  React.useEffect(() => {
    setModalOpen(false);
    setBuySide(null);
  }, [pathname]);

  // When the component unmounts, reset the modal and buy side states
  React.useEffect(() => {
    return () => {
      setModalOpen(false);
      setBuySide(null);
    };
  }, []);

  function onYes(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setBuySide("yes"); setModalOpen(true); }
  function onNo(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setBuySide("no"); setModalOpen(true); }

  return (
    <>
      <Link href={`/markets/${market.id}`} className="block">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`${catCls(category)} border`}>{category}</Badge>
              <Badge className={`px-2 py-0.5 rounded-full ${statusCls(status)}`}>{status}</Badge>
            </div>
            <CardTitle className="text-xl pt-2 line-clamp-2 min-h-16">{titleOf(market)}</CardTitle>
          </CardHeader>

          <CardContent>
            <MarketProbability implied={implied} />
            <div className="flex justify-center gap-3 sm:gap-6 mt-5">
              <button
                className="w-32 sm:w-32 px-4 py-2 rounded-xl btn-yes glowing-focus"
                onClick={onYes}
                aria-label="Choose Yes"
                disabled={market.status !== "open"}
              >
                Choose Yes
              </button>
              <button
                className="w-32 sm:w-32 px-4 py-2 rounded-xl btn-no glowing-focus"
                onClick={onNo}
                aria-label="Choose No"
                disabled={market.status !== "open"}
              >
                Choose No
              </button>
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-4 md:mt-5">
              <span>Volume: <span className="font-semibold">{fmtNum(volume)} π</span></span>
              <span>Ends: {fmtShortDate(market?.end_date)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {buySide && (
        <QuickBuyModal
          open={modalOpen}
          marketId={market.id}
          side={buySide}
          onClose={() => {
            setModalOpen(false);
            setBuySide(null);
          }}
          onDone={() => {
            setModalOpen(false);
            setBuySide(null);
            try { const r = require("next/navigation"); r?.useRouter?.().refresh?.(); } catch (_) { }
          }}
        />
      )}
    </>
  );
}
export default MarketCard;

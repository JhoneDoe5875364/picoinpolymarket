"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { Market } from "@/lib/types";
import { PredictionPanel } from "@/components/market/PredictionPanel";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn, toPriceLabel } from "@/lib/utils";

const DEFAULT_MARKET_ICON = "/images/markets/market-default.png";

interface MarketDetailMobileTradeProps {
  market: Market;
}

function outcomeSideLabel(outcome: "YES" | "NO"): string {
  return outcome === "YES" ? "Yes" : "No";
}

function MarketTradeSheetHeader({
  market,
  outcome,
  yesPrice,
  noPrice,
  onOutcomeChange,
}: {
  market: Market;
  outcome: "YES" | "NO";
  yesPrice: number;
  noPrice: number;
  onOutcomeChange: (outcome: "YES" | "NO") => void;
}) {
  const icon =
    typeof market.icon === "string" && market.icon.trim().length > 0 ? market.icon : null;
  const [iconSrc, setIconSrc] = useState(icon ?? DEFAULT_MARKET_ICON);

  useEffect(() => {
    setIconSrc(icon ?? DEFAULT_MARKET_ICON);
  }, [icon]);

  const selectedPrice = outcome === "YES" ? yesPrice : noPrice;

  const toggleOutcome = () => {
    onOutcomeChange(outcome === "YES" ? "NO" : "YES");
  };

  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted/20">
          <img
            src={iconSrc}
            alt={market.question}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => {
              if (iconSrc !== DEFAULT_MARKET_ICON) setIconSrc(DEFAULT_MARKET_ICON);
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">{market.question}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-bold",
                outcome === "YES"
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-red-600 dark:text-red-500"
              )}
            >
              {outcomeSideLabel(outcome)} · {toPriceLabel(selectedPrice)}
            </p>
            <button
              type="button"
              onClick={toggleOutcome}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
              aria-label={`Switch to ${outcome === "YES" ? "No" : "Yes"}`}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketDetailMobileTrade({ market }: MarketDetailMobileTradeProps) {
  const [open, setOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO">("YES");

  const yesPrice = market?.outcome_price_yes ?? 0.5;
  const noPrice = market?.outcome_price_no ?? 0.5;

  const openPanel = (outcome: "YES" | "NO") => {
    setSelectedOutcome(outcome);
    setOpen(true);
  };

  return (
    <>
      {!open && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 md:hidden"
          role="group"
          aria-label="Buy prediction"
        >
          <div className="rounded-t-2xl border-t border-border bg-background px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => openPanel("YES")}
                className="flex flex-1 flex-col items-center justify-center rounded-md bg-emerald-600 px-3 py-3 text-white"
              >
                <span className="text-sm font-bold leading-tight">
                  Buy Yes {toPriceLabel(yesPrice)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => openPanel("NO")}
                className="flex flex-1 flex-col items-center justify-center rounded-md bg-red-600 px-3 py-3 text-white"
              >
                <span className="text-sm font-bold leading-tight">
                  Buy No {toPriceLabel(noPrice)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Place prediction</SheetTitle>
          <MarketTradeSheetHeader
            market={market}
            outcome={selectedOutcome}
            yesPrice={yesPrice}
            noPrice={noPrice}
            onOutcomeChange={setSelectedOutcome}
          />
          <PredictionPanel
            market={market}
            outcome={selectedOutcome}
            onOutcomeChange={setSelectedOutcome}
            hideOutcomeSelector
            className="border-0 shadow-none"
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

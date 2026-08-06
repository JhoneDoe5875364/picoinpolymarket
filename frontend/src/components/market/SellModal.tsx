"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { executeSellTrade, type SellTradeResult } from "@/lib/trade/executeSellTrade";
import { sanitizeShares } from "@/lib/trade/tradeTerms";
import { apiFetchWithToken } from "@/lib/api";
import { formatPiAmount } from "@/lib/utils";
import { invalidateProfileOverview } from "@/components/profile/ProfileOverview";

type Props = {
  open: boolean;
  positionId: number | string;
  outcome: "YES" | "NO";
  marketQuestion?: string;
  currentPrice: number;
  heldShares: number;
  onClose: () => void;
  onSold?: () => void; // refresh callback after a successful sell
};

type SellQuote = {
  price: number;
  gross: number;
  fee: number;
  netPayout: number;
  sellable: boolean;
};

export default function SellModal({
  open,
  positionId,
  outcome,
  marketQuestion,
  currentPrice,
  heldShares,
  onClose,
  onSold,
}: Props) {
  const { toast } = useToast();

  const [sharesInput, setSharesInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [result, setResult] = useState<SellTradeResult | null>(null);
  const [quote, setQuote] = useState<SellQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string>("");

  const shares = useMemo(() => sanitizeShares(Number(sharesInput)), [sharesInput]);

  // The real sell price is pool-collateralized and computed server-side, so we
  // fetch a live quote instead of guessing from the AMM price. Debounced.
  useEffect(() => {
    if (!open || shares <= 0) {
      setQuote(null);
      setQuoteError("");
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError("");
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiFetchWithToken<{
          ok?: boolean;
          sellable?: boolean;
          price?: number;
          gross?: number;
          fee?: number;
          net_payout?: number;
          reason?: string;
        }>(`/positions/${positionId}/sell-quote?shares=${shares}`, { method: "GET" });
        if (cancelled) return;
        setQuote({
          price: Number(res?.price ?? 0),
          gross: Number(res?.gross ?? 0),
          fee: Number(res?.fee ?? 0),
          netPayout: Number(res?.net_payout ?? 0),
          sellable: Boolean(res?.sellable),
        });
        setQuoteError(
          res?.sellable === false
            ? res?.reason || "This position cannot be sold right now."
            : ""
        );
      } catch (error) {
        if (cancelled) return;
        // Never render a failed quote as 0π — a silent catch here made a server
        // 500 look like a legitimate "worth nothing" price.
        setQuote(null);
        setQuoteError(
          error instanceof Error ? error.message : "Could not load the sell quote."
        );
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, positionId, shares]);

  if (!open) return null;

  // Only a live, sellable quote may arm the button. Without one we do not know
  // what the server would pay, so selling blind is never allowed.
  const canSell =
    !quoteLoading &&
    Boolean(quote?.sellable) &&
    (quote?.price ?? 0) > 0 &&
    shares > 0 &&
    shares <= heldShares + 1e-9;

  // Show a dash, never 0π, when there is no quote to show.
  const quoteAmount = (value: number | undefined) =>
    quoteLoading ? "…" : quote ? formatPiAmount(value ?? 0) : "—";

  const handleSellAll = () => {
    setSharesInput(String(heldShares));
  };

  const handleSell = async () => {
    setMsg("");
    setResult(null);

    const entered = Number(sharesInput);
    if (!Number.isFinite(entered) || entered <= 0) {
      setMsg("Enter valid shares.");
      return;
    }
    if (entered > heldShares + 1e-9) {
      setMsg(`You only hold ${heldShares} shares.`);
      return;
    }
    // Never submit without a usable quote: expected_price must be > 0 or the
    // server rejects the request outright (422).
    if (!quote || !quote.sellable || quote.price <= 0) {
      setMsg(quoteError || "No live sell quote available. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const res = await executeSellTrade({
        positionId,
        sellShares: entered,
        // Guard against the pool price moving between quote and execution.
        expectedPrice: quote?.price,
      });
      setResult(res);
      if (res.ok) {
        invalidateProfileOverview();
        setSharesInput("");
        toast({
          title: "Sale complete",
          description: `You received ${formatPiAmount(res.netPayout ?? quote?.netPayout ?? 0)}.`,
        });
        onSold?.();
      } else {
        setMsg("Sale could not be completed. Please try again.");
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Sale failed.";
      // Surface the server's reason (price moved / market closed / no wallet).
      setMsg(detail);
      toast({
        title: "Sale failed",
        description: detail,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 p-3 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] md:pb-3">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-foreground shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">Sell — {outcome}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {marketQuestion && (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{marketQuestion}</p>
          )}

          <div className="flex justify-between items-center">
            <label className="text-sm text-muted-foreground">Shares to sell</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSellAll}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40"
              >
                All ({heldShares})
              </button>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                max={heldShares}
                className="mt-0 w-[160px] rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none"
                placeholder="e.g., 5"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sell price / share</span>
              <span>{quoteAmount(quote?.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shares</span>
              <span>{shares}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross</span>
              <span>{quoteAmount(quote?.gross)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee</span>
              <span>
                {quoteLoading ? "…" : quote ? `-${formatPiAmount(quote.fee)}` : "—"}
              </span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">You receive</span>
              <span>{quoteAmount(quote?.netPayout)}</span>
            </div>
            <p className="pt-1 text-[11px] text-muted-foreground">
              Price is your share of the market pool — always backed by funds already in the market.
            </p>
          </div>

          {result?.ok && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs">
              <p className="font-semibold text-foreground">Sale submitted successfully.</p>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <p>Received: {formatPiAmount(result.netPayout ?? quote?.netPayout ?? 0)}</p>
                <p>Reference ID: {result.txid || "Pending"}</p>
                <p>
                  {result.isClosed
                    ? "Position fully closed."
                    : `Remaining shares: ${result.remainingShares ?? "—"}`}
                </p>
              </div>
            </div>
          )}

          {quoteError && !result?.ok && (
            <div className="text-sm text-destructive">{quoteError}</div>
          )}

          {msg && <div className="text-sm text-destructive">{msg}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <button
            className="rounded-xl border border-border px-4 py-2 text-foreground hover:bg-muted/40"
            onClick={onClose}
            disabled={loading}
          >
            {result?.ok ? "Close" : "Cancel"}
          </button>
          <button
            className={`rounded-md px-4 py-2 text-white glowing-focus btn-no ${
              loading || !canSell ? "opacity-50" : ""
            }`}
            onClick={handleSell}
            disabled={loading || Boolean(result?.ok) || !canSell}
          >
            {loading ? "Selling…" : "Sell"}
          </button>
        </div>
      </div>
    </div>
  );
}

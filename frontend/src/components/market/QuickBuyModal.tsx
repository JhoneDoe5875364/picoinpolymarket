"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  executeBuyTrade,
  type ExecuteBuyTradeResult,
  type TradeFailureReason,
  type TradeProgressStage,
} from "@/lib/trade/executeBuyTrade";
import {
  calculateTradeBreakdown,
  formatPi,
  sanitizeShares,
  TRADE_TERMS,
} from "@/lib/trade/tradeTerms";

type Props = {
  open: boolean;
  marketId: number | string;
  outcome: "YES" | "NO";
  marketQuestion?: string;
  price?: number;
  onClose: () => void;
  onDone?: () => void; // optional refresh callback
};

export default function QuickBuyModal({ open, marketId, outcome, marketQuestion, price = 0.5, onClose, onDone }: Props) {
  const { toast } = useToast();
  const { ppxUser } = useAuth();

  const [sharesInput, setSharesInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [stage, setStage] = useState<TradeProgressStage | null>(null);
  const [failureReason, setFailureReason] = useState<TradeFailureReason | null>(null);
  const [tradeResult, setTradeResult] = useState<ExecuteBuyTradeResult | null>(null);
  const shares = useMemo(() => {
    const parsed = Number(sharesInput);
    return sanitizeShares(parsed);
  }, [sharesInput]);
  const breakdown = useMemo(() => calculateTradeBreakdown(price, shares), [price, shares]);

  const stageLabelMap: Record<TradeProgressStage, string> = {
    preparing_payment: "Preparing payment",
    awaiting_pi_confirmation: "Awaiting Pi confirmation",
    payment_detected: "Payment detected",
    position_recorded: "Position recorded",
    prediction_confirmed: "Prediction confirmed",
  };

  const failureGuideMap: Record<TradeFailureReason, string> = {
    payment_cancelled: "Payment was cancelled. Re-open the wallet approval and try again.",
    payment_pending: "Payment is still pending. Please check again shortly.",
    payment_detected_position_not_recorded:
      "Payment was detected but position was not recorded. Contact support with reference ID.",
    position_recorded_confirmation_delayed:
      "Position may be recorded, but confirmation is delayed. Check your profile soon.",
    network_error: "Network error occurred. Verify your connection and retry.",
  };

  if (!open) return null;

  const handlePay = async () => {
    setMsg("");
    setStage(null);
    setFailureReason(null);
    setTradeResult(null);

    if (!ppxUser) {
      setMsg("Please log in first.");
      return;
    }

    const enteredShares = Number(sharesInput);
    if (!Number.isFinite(enteredShares) || enteredShares <= 0) {
      setMsg("Enter valid shares.");
      return;
    }

    setStage("preparing_payment");
    setLoading(true);
    try {
      const result = await executeBuyTrade({
        userId: ppxUser.id,
        marketId,
        outcome,
        price,
        shares: enteredShares,
        toast,
        onStageChange: setStage,
        onPositionCreated: () => {
          setSharesInput("");
          onDone?.();
        },
      });
      setTradeResult(result);
      if (!result.success) {
        setFailureReason(result.failureReason ?? "payment_pending");
      }
    } catch (error) {
      console.error(error);
      setFailureReason("network_error");
      toast({
        title: "Deposit Failed",
        description: "The deposit was cancelled or failed. Please try again.",
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 p-3 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] md:pb-3">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-foreground shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">Quick Buy — {outcome}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {marketQuestion && (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{marketQuestion}</p>
          )}
          <div className="flex justify-between items-center">
            <label className="text-sm text-muted-foreground">Shares</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              className="mt-1 w-[250px] rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none"
              placeholder="e.g., 5"
              value={sharesInput}
              onChange={(e) => setSharesInput(e.target.value)}
            />
          </div>
          <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span>{price.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shares</span>
              <span>{shares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{TRADE_TERMS.amount}</span>
              <span>{formatPi(breakdown.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{TRADE_TERMS.fee}</span>
              <span>{formatPi(breakdown.fee)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">{TRADE_TERMS.totalCost}</span>
              <span>{formatPi(breakdown.totalCost)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">{TRADE_TERMS.estimatedReturn}</span>
              <span>{formatPi(breakdown.estimatedReturn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{TRADE_TERMS.netResult}</span>
              <span>{formatPi(breakdown.netResult)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{TRADE_TERMS.lossIfIncorrect}</span>
              <span>{formatPi(breakdown.lossIfIncorrect)}</span>
            </div>
          </div>
          {stage && (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Status:</span> {stageLabelMap[stage]}
            </div>
          )}
          {failureReason && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {failureGuideMap[failureReason]}
            </div>
          )}
          {tradeResult?.success && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs">
              <p className="font-semibold text-foreground">Prediction submitted successfully.</p>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <p>{marketQuestion || "Market"}</p>
                <p>Side: {outcome}</p>
                <p>{TRADE_TERMS.amount}: {formatPi(breakdown.amount)}</p>
                <p>{TRADE_TERMS.fee}: {formatPi(breakdown.fee)}</p>
                <p>{TRADE_TERMS.totalCost}: {formatPi(breakdown.totalCost)}</p>
                <p>Reference ID: {tradeResult.txid || tradeResult.paymentId || "Pending"}</p>
                <p>Wallet status: {tradeResult.status === "confirmed" ? "Confirmed" : "Pending"}</p>
              </div>
              <Link href="/profile" className="mt-2 inline-block font-medium text-primary underline">
                View position in profile
              </Link>
            </div>
          )}
          {msg && <div className="text-sm text-destructive">{msg}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <button
            className="rounded-xl border border-border px-4 py-2 text-foreground hover:bg-muted/40"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`rounded-md px-4 py-2 text-white glowing-focus ${outcome === "YES" ? "btn-yes" : "btn-no"} ${
              loading ? "opacity-80" : ""
            }`}
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? "Placing…" : `Buy ${outcome}`}
          </button>
        </div>
      </div>
    </div>
  );
}

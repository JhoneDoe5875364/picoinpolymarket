"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { executeBuyTrade } from "@/lib/trade/executeBuyTrade";
import { FEE } from "@/lib/constants";

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
  const shares = useMemo(() => {
    const parsed = Number(sharesInput);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [sharesInput]);
  const piAmount = useMemo(() => price * shares, [price, shares]);
  const piFee = useMemo(() => piAmount * FEE, [piAmount]);
  const piTotalAmount = useMemo(() => piAmount + piFee, [piAmount, piFee]);
  const potentialProfit = useMemo(() => shares, [shares]);

  if (!open) return null;

  const handlePay = async () => {
    setMsg("");
    if (!ppxUser) {
      setMsg("Please log in first.");
      return;
    }

    const enteredShares = Number(sharesInput);
    if (!Number.isFinite(enteredShares) || enteredShares <= 0) {
      setMsg("Enter valid shares.");
      return;
    }

    setLoading(true);
    try {
      await executeBuyTrade({
        userId: ppxUser.id,
        marketId,
        outcome,
        price,
        shares: enteredShares,
        toast,
        onPositionCreated: () => {
          setSharesInput("");
          onDone?.();
        },
      });

      onClose();
    } catch (error) {
      console.error(error);
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
              <span className="text-muted-foreground">price</span>
              <span>{price.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">shares</span>
              <span>{shares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">piAmount</span>
              <span>{piAmount.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">piFee</span>
              <span>{piFee.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">piTotalAmount</span>
              <span>{piTotalAmount.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">potentialProfit</span>
              <span>{potentialProfit.toFixed(2)} π</span>
            </div>
          </div>
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

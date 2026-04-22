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
      <div className="w-full max-w-sm rounded-2xl bg-[#121212] border border-white/10 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold">Quick Buy — {outcome}</h2>
          <button onClick={onClose} className="text-sm opacity-80 hover:opacity-100">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {marketQuestion && (
            <p className="text-sm text-white/80 leading-snug line-clamp-2">{marketQuestion}</p>
          )}
          <div className="flex justify-between items-center">
            <label className="text-sm opacity-80">Shares</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              className="mt-1 w-[250px] rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none"
              placeholder="e.g., 5"
              value={sharesInput}
              onChange={(e) => setSharesInput(e.target.value)}
            />
          </div>
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">price</span>
              <span>{price.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">shares</span>
              <span>{shares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">piAmount</span>
              <span>{piAmount.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">piFee</span>
              <span>{piFee.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-white/90">piTotalAmount</span>
              <span>{piTotalAmount.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-white/90">potentialProfit</span>
              <span>{potentialProfit.toFixed(2)} π</span>
            </div>
          </div>
          {msg && <div className="text-sm opacity-80 text-red-500">{msg}</div>}
        </div>

        <div className="px-4 py-3 flex items-center justify-end gap-2 border-t border-white/10">
          <button
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded-md text-white ${
              outcome === "YES" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            } glowing-focus`}
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

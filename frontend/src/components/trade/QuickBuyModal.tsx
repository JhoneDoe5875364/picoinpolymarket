"use client";

import { apiFetch, apiFetchWithToken } from "@/lib/api";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getPi } from "@/lib/pi";

type Props = {
  open: boolean;
  marketId: string;
  side: "yes" | "no";
  onClose: () => void;
  onDone?: () => void; // optional refresh callback
};

export default function QuickBuyModal({ open, marketId, side, onClose, onDone }: Props) {
  const { toast } = useToast();
  const { authUser } = useAuth();
  const router = useRouter()

  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  if (!open) return null;

  const handlePay = async () => {
    setMsg("");
    if (!authUser) {
      setMsg("Please log in first.");
      return;
    }

    const gross = Number(amount);
    if (!Number.isFinite(gross) || gross <= 0) {
      setMsg("Enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      const scopes = ["payments"];
      const onIncompletePaymentFound = (payment: any) => {
        (async () => {
          const res = await apiFetch(`/pi/payments/incomplete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ payment })
          });

          if (res.status == 'handled') {
            toast({
              title: "Uncompleted payment found",
              description: payment,
              variant: "destructive",
            });
          }
        })()
      };
      const pi = getPi();
      await pi.authenticate(scopes, onIncompletePaymentFound);
      await pi.createPayment({
        amount: amount,
        memo: 'Deposit to Pi Predict',
        metadata: { userId: authUser.uid }
      }, {
        onReadyForServerApproval: async (paymentId) => {
          await apiFetchWithToken(`/pi/payments/approve`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          const res = await apiFetchWithToken(`/pi/payments/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ paymentId, txid })
          });

          if (res.status == 'completed') {
            const res = await apiFetchWithToken(`/positions`, {
              method: "POST",
              body: JSON.stringify({
                market_id: marketId,
                // type: 'buy',
                side: side,
                amount: amount
              }),
            });

            if (res.ok) {
              toast({
                title: "Deposit Successful",
                description: `Successfully deposited ${amount} π from your wallet.`,
              });
              setLoading(false);
              setAmount("");
              onDone?.();
              onClose();
              // auto refresh the page
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          }
        },
        onCancel: async (paymentId) => {
          const res = await apiFetchWithToken(`/pi/payments/cancel`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ paymentId })
          });
          if (res.status == 'cancelled') {
            setLoading(false);
            toast({
              title: "Deposit Failed",
              description: "The deposit was cancelled or failed. Please try again.",
              variant: 'destructive'
            });
          }
        },
        onError: (error) => {
          console.error(error);
          setLoading(false);
          toast({
            title: "Deposit Failed",
            description: "An error occurred during the deposit. Please try again.",
            variant: 'destructive'
          });
        }
      });
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-3">
      <div className="w-full max-w-sm rounded-2xl bg-[#121212] border border-white/10 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold">Quick Buy — {side.toUpperCase()}</h2>
          <button onClick={onClose} className="text-sm opacity-80 hover:opacity-100">✕</button>
        </div>

        <div className="p-4 space-y-3">
          <label className="text-sm opacity-80">Amount (Pi, gross)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            className="mt-1 w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none"
            placeholder="e.g., 10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {msg && <div className="text-xs opacity-80">{msg}</div>}
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
            className={`px-4 py-2 rounded-xl ${side === "yes" ? "btn-yes" : "btn-no"} glowing-focus`}
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? "Placing…" : `Buy ${side.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

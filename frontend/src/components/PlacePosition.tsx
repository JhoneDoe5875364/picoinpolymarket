
"use client";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchWithToken } from "@/lib/api";
import { getPi } from "@/lib/pi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Market } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function PlacePosition({ market, side }: { market: Market; side: "yes" | "no" }) {
  const { toast } = useToast();
  const { authUser } = useAuth();
  const router = useRouter()

  const [amount, setAmount] = useState<number>(1);
  const [busy, setBusy] = useState(false);

  const [yesPrice, setYesPrice] = useState(0.5)
  const [noPrice, setNoPrice] = useState(0.5)
  const [potentialPayout, setPotentialPayout] = useState(0)
  const [fee, setFee] = useState(0)

  useEffect(() => {
    setYesPrice(market?.yes_price ?? 0.5)
    setNoPrice(market?.no_price ?? 0.5)
  }, [market])

  useEffect(() => {
    const price = side === 'yes' ? yesPrice : noPrice;
    setPotentialPayout(amount * 0.98 / price)
    setFee(amount * 0.02)
  }, [amount])

  const handlePay = async () => {
    if (!authUser) {
      toast({
        title: "Please log in",
        description: "You must be logged in to place a prediction.",
        variant: "destructive"
      });
      return;
    }

    setBusy(true);
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

          // alert(JSON.stringify(res));

          if (res.status == 'completed') {
            const res = await apiFetchWithToken(`/positions`, {
              method: "POST",
              body: JSON.stringify({
                market_id: market.id,
                // type: 'buy',
                side: side,
                amount: amount
              }),
            });

            if (res.ok) {
              router.refresh();
            }

            toast({
              title: "Deposit Successful",
              description: `Successfully deposited ${amount} π from your wallet.`,
            });
          } else {
            toast({
              title: "Deposit Failed",
              description: `Failed deposited ${amount} π from your wallet.`,
            });
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
            toast({
              title: "Deposit Failed",
              description: "The deposit was cancelled or failed. Please try again.",
              variant: 'destructive'
            });
          }
        },
        onError: (error) => {
          console.error(error);
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
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (π)</Label>
        <Input id="amount" type="number" min={1} value={amount} onChange={e => setAmount(+e.target.value)} className="text-foreground" />
      </div>

      <div className="space-y-2 text-sm">
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Potential Payout</span>
          <span>{potentialPayout.toFixed(2)} π</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transaction Fee (2%)</span>
          <span>{fee.toFixed(2)} π</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Your Cost</span>
          <span>{(amount).toFixed(2)} π</span>
        </div>
      </div>

      <Button onClick={handlePay} disabled={busy || market.status !== 'open' || !authUser} className={cn(
        "w-full text-lg font-bold tracking-wider",
        side === 'yes' ? 'btn-yes' : 'btn-no'
      )}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Forecast {side.toUpperCase()}
      </Button>
    </div>
  );
}

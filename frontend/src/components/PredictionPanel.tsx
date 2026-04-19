"use client";

import { useMemo, useState } from "react";
import { apiFetch, apiFetchWithToken } from "@/lib/api";
import { getPi } from "@/lib/pi";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { Market } from "@/lib/types";
import { FEE } from "@/lib/constants";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";


interface PredictionPanelProps {
  market: Market;
}

export function PredictionPanel({ market }: PredictionPanelProps) {
  const { toast } = useToast();
  const { authUser } = useAuth();
  const router = useRouter();

  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [busy, setBusy] = useState(false);
  const [shares, setShares] = useState<number>(1);
  const yesPrice = market?.yes_price ?? 0.5;
  const noPrice = market?.no_price ?? 0.5;

  const selectedPrice = useMemo(
    () => (outcome === "YES" ? yesPrice : noPrice),
    [outcome, yesPrice, noPrice]
  );

  const piAmount = useMemo(() => selectedPrice * shares, [selectedPrice, shares]);
  const piFee = useMemo(() => piAmount * FEE, [piAmount]);
  const piTotalAmount = useMemo(() => piAmount + piFee, [piAmount, piFee]);
  const potentialProfit = useMemo(() => shares, [shares]);

  const handlePay = async () => {
    if (!authUser) {
      toast({
        title: "Please log in",
        description: "You must be logged in to place a prediction.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);

    try {
      const scopes = ["payments"];
      const onIncompletePaymentFound = async (payment: any) => {
        const res = await apiFetch(`/pi/payments/incomplete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payment }),
        });

        if (res.status == "handled") {
          toast({
            title: "Uncompleted payment found",
            description: payment,
            variant: "destructive",
          });
        }
      };
      const pi = getPi();
      await pi.authenticate(scopes, onIncompletePaymentFound);

      const res = await apiFetchWithToken(`/orders`, {
        method: "POST",
        body: JSON.stringify({
          user_id: authUser.uid,
          market_id: market.id,
          side: "BUY",
          outcome: outcome,
          price: selectedPrice,
          size: shares,
        }),
      });

      if (res.ok) {
        toast({
          title: "Order created",
          description: "Order created successfully",
        });
      } else {
        toast({
          title: "Order creation failed",
          description: "Failed to create order",
        });
      }

      const paymentRes = await apiFetchWithToken(`/pi/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount: shares,
          memo: "Deposit to Pi Predict",
          metadata: { userId: authUser.uid },
        }),
      });

      if (paymentRes.ok) {
        toast({
          title: "Payment created",
          description: "Payment created successfully",
        });
      } else {
        toast({
          title: "Payment creation failed",
          description: "Failed to create payment",
        });
      }

      await pi.createPayment(
        {
          amount: shares,
          memo: "Deposit to Pi Predict",
          metadata: { userId: authUser.uid },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            await apiFetchWithToken(`/pi/payments/approve`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentId }),
            });
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            const completeRes = await apiFetchWithToken(`/pi/payments/complete`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentId, txid }),
            });

            if (completeRes.status == "completed") {
              const positionRes = await apiFetchWithToken(`/positions`, {
                method: "POST",
                body: JSON.stringify({
                  market_id: market.id,
                  side: outcome,
                  amount: shares,
                }),
              });

              if (positionRes.ok) {
                router.refresh();
              }

              toast({
                title: "Deposit Successful",
                description: `Successfully deposited ${shares} π from your wallet.`,
              });
            } else {
              toast({
                title: "Deposit Failed",
                description: `Failed deposited ${shares} π from your wallet.`,
              });
            }
          },
          onCancel: async (paymentId) => {
            const cancelRes = await apiFetchWithToken(`/pi/payments/cancel`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentId }),
            });
            if (cancelRes.status == "cancelled") {
              toast({
                title: "Deposit Failed",
                description: "The deposit was cancelled or failed. Please try again.",
                variant: "destructive",
              });
            }
          },
          onError: (error) => {
            console.error(error);
            toast({
              title: "Deposit Failed",
              description: "An error occurred during the deposit. Please try again.",
              variant: "destructive",
            });
          },
        }
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "Deposit Failed",
        description: "The deposit was cancelled or failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <RadioGroup
          onValueChange={(value: "YES" | "NO") => setOutcome(value)}
          value={outcome}
          className="grid grid-cols-2 gap-3"
        >
          <div>
            <RadioGroupItem value="YES" id="yes" className="peer sr-only" />
            <Label
              htmlFor="yes"
              className={cn(
                "flex h-11 items-center justify-center rounded-md px-4",
                "cursor-pointer text-sm font-semibold",
                "bg-slate-800 text-slate-500",
                "peer-data-[state=checked]:bg-emerald-600 peer-data-[state=checked]:text-white",
              )}
            >
              Yes {yesPrice.toFixed(2)} π
            </Label>
          </div>

          <div>
            <RadioGroupItem value="NO" id="no" className="peer sr-only" />
            <Label
              htmlFor="no"
              className={cn(
                "flex h-11 items-center justify-center rounded-md px-4",
                "cursor-pointer text-sm font-semibold",
                "bg-slate-800 text-slate-500",
                "peer-data-[state=checked]:bg-red-600 peer-data-[state=checked]:text-white",
              )}
            >
              No {noPrice.toFixed(2)} π
            </Label>
          </div>
        </RadioGroup>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-white">Price</span>
            <span>{selectedPrice.toFixed(2)} π</span>
          </div>
          <div className="flex w-full items-center gap-2">
            <Label htmlFor="amount" className="w-1/2">
              Shares
            </Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={shares}
              onChange={(e) => setShares(+e.target.value)}
              className="w-1/2 text-right text-foreground"
            />
          </div>

          <div className="space-y-2 text-sm">
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actual Pi Amount (excl. fee)</span>
              <span>{piAmount.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction Fee ({(FEE * 100).toFixed(0)}%)</span>
              <span>{piFee.toFixed(2)} π</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Pi Amount (incl. fee)</span>
              <span>{piTotalAmount.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Potential Profit</span>
              <span>{potentialProfit.toFixed(2)} π</span>
            </div>
          </div>

          <Button
            onClick={handlePay}
            className={cn(
              "w-full text-lg font-bold tracking-wider",
              "bg-sky-500 text-white hover:bg-sky-500/90 shadow-none"
            )}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Trade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

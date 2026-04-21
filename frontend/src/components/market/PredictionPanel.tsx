"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { Market } from "@/lib/types";
import { FEE } from "@/lib/constants";
import { executeBuyTrade } from "@/lib/trade/executeBuyTrade";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Separator } from "../ui/separator";
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
  const yesPrice = market?.outcome_price_yes ?? 0.5;
  const noPrice = market?.outcome_price_no ?? 0.5;

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
      await executeBuyTrade({
        userId: authUser.uid,
        marketId: market.id,
        outcome,
        price: selectedPrice,
        shares,
        toast,
        onPositionCreated: () => router.refresh(),
      });
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
                "flex h-10 items-center justify-center rounded-md px-4",
                "cursor-pointer text-sm font-semibold",
                "bg-secondary text-muted-foreground",
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
                "flex h-10 items-center justify-center rounded-md px-4",
                "cursor-pointer text-sm font-semibold",
                "bg-secondary text-muted-foreground",
                "peer-data-[state=checked]:bg-red-600 peer-data-[state=checked]:text-white",
              )}
            >
              No {noPrice.toFixed(2)} π
            </Label>
          </div>
        </RadioGroup>

        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground">Price</span>
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
                className="h-8 w-1/2 text-right text-foreground"
              />
            </div>
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
          </div>

          <div className="space-y-2 text-sm">
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
              "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
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

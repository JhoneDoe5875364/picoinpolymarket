"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Market } from "@/lib/types";
import {
  executeBuyTrade,
  type ExecuteBuyTradeResult,
  type TradeFailureReason,
  type TradeProgressStage,
} from "@/lib/trade/executeBuyTrade";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Separator } from "../ui/separator";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateTradeBreakdown,
  formatPi,
  sanitizeShares,
  TRADE_TERMS,
} from "@/lib/trade/tradeTerms";


interface PredictionPanelProps {
  market: Market;
}

export function PredictionPanel({ market }: PredictionPanelProps) {
  const { toast } = useToast();
  const { ppxUser } = useAuth();
  const router = useRouter();

  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [busy, setBusy] = useState(false);
  const [shares, setShares] = useState<number>(1);
  const [stage, setStage] = useState<TradeProgressStage | null>(null);
  const [failureReason, setFailureReason] = useState<TradeFailureReason | null>(null);
  const [tradeResult, setTradeResult] = useState<ExecuteBuyTradeResult | null>(null);
  const yesPrice = market?.outcome_price_yes ?? 0.5;
  const noPrice = market?.outcome_price_no ?? 0.5;

  const selectedPrice = useMemo(
    () => (outcome === "YES" ? yesPrice : noPrice),
    [outcome, yesPrice, noPrice]
  );

  const safeShares = useMemo(() => sanitizeShares(shares), [shares]);
  const breakdown = useMemo(
    () => calculateTradeBreakdown(selectedPrice, safeShares),
    [selectedPrice, safeShares]
  );

  const stageLabelMap: Record<TradeProgressStage, string> = {
    preparing_payment: "Preparing payment",
    awaiting_pi_confirmation: "Awaiting Pi confirmation",
    payment_detected: "Payment detected",
    position_recorded: "Position recorded",
    prediction_confirmed: "Prediction confirmed",
  };

  const failureGuideMap: Record<TradeFailureReason, string> = {
    payment_cancelled: "Payment was cancelled. Re-open the wallet approval and try again.",
    payment_pending: "Payment is still pending. Refresh this page in a moment to check status.",
    payment_detected_position_not_recorded:
      "Payment was detected but position recording failed. Contact support with your reference ID.",
    position_recorded_confirmation_delayed:
      "Position may be recorded, but confirmation is delayed. Check your profile positions shortly.",
    network_error: "Network error occurred. Verify your connection and retry.",
  };

  const handlePay = async () => {
    if (!ppxUser) {
      toast({
        title: "Please log in",
        description: "You must be logged in to place a prediction.",
        variant: "destructive",
      });
      return;
    }

    if (safeShares <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid amount before placing a prediction.",
        variant: "destructive",
      });
      return;
    }

    setStage("preparing_payment");
    setFailureReason(null);
    setTradeResult(null);
    setBusy(true);

    try {
      const result = await executeBuyTrade({
        userId: ppxUser.id,
        marketId: market.id,
        outcome,
        price: selectedPrice,
        shares: safeShares,
        toast,
        onPositionCreated: () => router.refresh(),
        onStageChange: setStage,
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
                onChange={(e) => setShares(Number(e.target.value))}
                className="h-8 w-1/2 text-right text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{TRADE_TERMS.amount}</span>
              <span>{formatPi(breakdown.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{TRADE_TERMS.fee}</span>
              <span>{formatPi(breakdown.fee)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{TRADE_TERMS.totalCost}</span>
              <span>{formatPi(breakdown.totalCost)}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{TRADE_TERMS.estimatedReturn} (if correct)</span>
              <span>{formatPi(breakdown.estimatedReturn)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{TRADE_TERMS.netResult} after cost</span>
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
                <p>{market.question}</p>
                <p>Side: {outcome}</p>
                <p>{TRADE_TERMS.amount}: {formatPi(breakdown.amount)}</p>
                <p>{TRADE_TERMS.fee}: {formatPi(breakdown.fee)}</p>
                <p>Reference ID: {tradeResult.txid || tradeResult.paymentId || "Pending"}</p>
                <p>Wallet status: {tradeResult.status === "confirmed" ? "Confirmed" : "Pending"}</p>
                <p>Expected resolution: {market.resolution_time || market.end_date || "Pending"}</p>
              </div>
              <Link href="/profile" className="mt-2 inline-block font-medium text-primary underline">
                View position in profile
              </Link>
            </div>
          )}

          <Button
            onClick={handlePay}
            className={cn(
              "w-full text-lg font-bold tracking-wider",
              "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
            )}
            disabled={busy}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Trade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

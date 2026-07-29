"use client";

import { useEffect, useMemo, useState } from "react";
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
import { TRADE_COPY } from "@/lib/copy/trade";
import { fetchPayoutWallet } from "@/lib/wallet";
import { invalidateProfileOverview } from "@/components/profile/ProfileOverview";

function BreakdownRow({
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className={cn("text-sm", labelClassName)}>{label}</span>
      <span className={cn("text-sm", valueClassName)}>{value}</span>
    </div>
  );
}

interface PredictionPanelProps {
  market: Market;
  defaultOutcome?: "YES" | "NO";
  outcome?: "YES" | "NO";
  onOutcomeChange?: (outcome: "YES" | "NO") => void;
  hideOutcomeSelector?: boolean;
  className?: string;
}

export function PredictionPanel({
  market,
  defaultOutcome = "YES",
  outcome: controlledOutcome,
  onOutcomeChange,
  hideOutcomeSelector = false,
  className,
}: PredictionPanelProps) {
  const { toast } = useToast();
  const { ppxUser } = useAuth();
  const router = useRouter();

  const [internalOutcome, setInternalOutcome] = useState<"YES" | "NO">(defaultOutcome);
  const isControlled = controlledOutcome !== undefined && onOutcomeChange !== undefined;
  const outcome = isControlled ? controlledOutcome : internalOutcome;

  const setOutcome = (value: "YES" | "NO") => {
    if (isControlled) {
      onOutcomeChange(value);
      return;
    }
    setInternalOutcome(value);
  };

  useEffect(() => {
    if (!isControlled) {
      setInternalOutcome(defaultOutcome);
    }
  }, [defaultOutcome, isControlled]);
  const [busy, setBusy] = useState(false);
  const [shares, setShares] = useState<number>(100);
  const [stage, setStage] = useState<TradeProgressStage | null>(null);
  const [failureReason, setFailureReason] = useState<TradeFailureReason | null>(null);
  const [tradeResult, setTradeResult] = useState<ExecuteBuyTradeResult | null>(null);
  const [needsWallet, setNeedsWallet] = useState(false);
  const yesPrice = market?.outcome_price_yes ?? 0.5;
  const noPrice = market?.outcome_price_no ?? 0.5;
  // A market only takes predictions while open. Once it closes/resolves, buying
  // must be blocked — the backend enforces this too.
  const isMarketOpen =
    !market?.is_resolved &&
    !market?.is_closed &&
    (market?.status === undefined || market?.status === "open");

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
    if (!isMarketOpen) {
      toast({
        title: "Market closed",
        description: "This market no longer accepts predictions.",
        variant: "destructive",
      });
      return;
    }
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

    // Require a payout wallet before spending Pi, so winnings have somewhere to go.
    setBusy(true);
    const payoutWallet = await fetchPayoutWallet();
    if (!payoutWallet) {
      setBusy(false);
      setNeedsWallet(true);
      return;
    }
    setNeedsWallet(false);

    setStage("preparing_payment");
    setFailureReason(null);
    setTradeResult(null);

    try {
      const result = await executeBuyTrade({
        userId: ppxUser.id,
        marketId: market.id,
        outcome,
        price: selectedPrice,
        shares: safeShares,
        toast,
        onPositionCreated: () => {
          // Drop the stale client-side profile-stats cache; router.refresh()
          // alone won't (it only re-runs server components).
          invalidateProfileOverview();
          router.refresh();
        },
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
        title: TRADE_COPY.sendPiFailedTitle,
        description: TRADE_COPY.sendPiFailedCancelled,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="space-y-6">
        {!hideOutcomeSelector && (
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
        )}

        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            <BreakdownRow
              label="Price"
              value={`${selectedPrice.toFixed(2)} π`}
              labelClassName="text-slate-600 dark:text-slate-400"
              valueClassName="font-medium text-foreground"
            />
            <div className="flex w-full items-center gap-2">
              <Label htmlFor="amount" className="w-1/2 text-slate-600 dark:text-slate-400">
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
            <BreakdownRow
              label={TRADE_TERMS.amount}
              value={formatPi(breakdown.amount)}
              labelClassName="text-slate-600 dark:text-slate-400"
            />
            <BreakdownRow
              label={TRADE_TERMS.fee}
              value={formatPi(breakdown.fee)}
              labelClassName="text-amber-600 dark:text-amber-500"
              valueClassName="text-amber-700 dark:text-amber-400"
            />
            <BreakdownRow
              label={TRADE_TERMS.totalCost}
              value={formatPi(breakdown.totalCost)}
              labelClassName="font-semibold text-foreground"
              valueClassName="font-semibold text-foreground"
            />
          </div>

          <div className="space-y-2 text-sm">
            <Separator />
            <BreakdownRow
              label={`${TRADE_TERMS.estimatedReturn} (if correct)`}
              value={formatPi(breakdown.estimatedReturn)}
              labelClassName="font-semibold text-emerald-600 dark:text-emerald-500"
              valueClassName="font-semibold text-emerald-600 dark:text-emerald-500"
            />
            <BreakdownRow
              label={`${TRADE_TERMS.netResult} after cost`}
              value={formatPi(breakdown.netResult)}
              labelClassName={cn(
                "font-semibold",
                breakdown.netResult >= 0
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-red-600 dark:text-red-500"
              )}
              valueClassName={cn(
                "font-semibold",
                breakdown.netResult >= 0
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-red-600 dark:text-red-500"
              )}
            />
            <BreakdownRow
              label={TRADE_TERMS.lossIfIncorrect}
              value={formatPi(breakdown.lossIfIncorrect)}
              labelClassName="text-red-600/90 dark:text-red-400"
              valueClassName="font-medium text-red-600 dark:text-red-500"
            />
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
                <p>{TRADE_TERMS.totalCost}: {formatPi(breakdown.totalCost)}</p>
                <p>Reference ID: {tradeResult.txid || tradeResult.paymentId || "Pending"}</p>
                <p>Wallet status: {tradeResult.status === "confirmed" ? "Confirmed" : "Pending"}</p>
                <p>Expected resolution: {market.resolution_time || market.end_date || "Pending"}</p>
              </div>
              <Link href="/profile" className="mt-2 inline-block font-medium text-primary underline">
                View position in profile
              </Link>
            </div>
          )}

          {needsWallet && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                Add a payout wallet first
              </p>
              <p className="mt-1 text-muted-foreground">
                Winnings are sent to your Pi wallet. Save your wallet address in your
                profile before placing a prediction.
              </p>
              <Link
                href="/profile"
                className="mt-2 inline-block font-semibold text-primary underline"
              >
                Go to profile →
              </Link>
            </div>
          )}

          {!isMarketOpen && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-center text-sm text-muted-foreground">
              This market is closed and no longer accepts predictions.
            </div>
          )}

          <Button
            onClick={handlePay}
            className={cn(
              "w-full text-lg font-bold tracking-wider",
              "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
            )}
            disabled={busy || !isMarketOpen}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isMarketOpen
              ? "Market closed"
              : busy
                ? TRADE_COPY.placingPrediction
                : TRADE_COPY.placePrediction}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

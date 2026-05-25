"use client";

import { apiFetch, apiFetchWithToken } from "@/lib/api";
import { getPi } from "@/lib/pi";
import { TRADE_COPY } from "@/lib/copy/trade";
import { buildTradePaymentPayload } from "@/lib/trade/tradeTerms";

export type BuyOutcome = "YES" | "NO";

type ToastLike = (payload: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

type ExecuteBuyTradeParams = {
  userId: string;
  marketId: number | string;
  outcome: BuyOutcome;
  price: number;
  shares: number;
  toast: ToastLike;
  onPositionCreated?: () => void;
  onStageChange?: (stage: TradeProgressStage) => void;
};

export type TradeProgressStage =
  | "preparing_payment"
  | "awaiting_pi_confirmation"
  | "payment_detected"
  | "position_recorded"
  | "prediction_confirmed";

export type TradeFailureReason =
  | "payment_cancelled"
  | "payment_pending"
  | "payment_detected_position_not_recorded"
  | "position_recorded_confirmation_delayed"
  | "network_error";

export type ExecuteBuyTradeResult = {
  success: boolean;
  status: "confirmed" | "cancelled" | "failed";
  paymentId?: string;
  txid?: string;
  orderCreated: boolean;
  paymentCreated: boolean;
  positionRecorded: boolean;
  failureReason?: TradeFailureReason;
  totalCost?: number;
};

export async function executeBuyTrade({
  userId,
  marketId,
  outcome,
  price,
  shares,
  toast,
  onPositionCreated,
  onStageChange,
}: ExecuteBuyTradeParams) {
  if (!Number.isFinite(shares) || shares <= 0) {
    throw new Error("Invalid shares amount");
  }

  const payment = buildTradePaymentPayload(price, shares);
  const paymentAmount = payment.totalCost;
  const sideLower = outcome.toLowerCase() as "yes" | "no";

  onStageChange?.("preparing_payment");

  const scopes = ["payments"];
  const onIncompletePaymentFound = async (paymentRecord: unknown) => {
    const res = await apiFetch<{ status?: string }>(`/pi/payments/incomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payment: paymentRecord }),
    });

    if (res.status === "handled") {
      toast({
        title: "Uncompleted payment found",
        description: String(paymentRecord),
        variant: "destructive",
      });
    }
  };

  const pi = getPi();
  await pi.authenticate(scopes, onIncompletePaymentFound);

  const orderRes = await apiFetchWithToken<{ ok?: boolean }>(`/orders`, {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      market_id: Number(marketId),
      side: "BUY",
      outcome,
      price: payment.price,
      size: payment.shares,
      amount: payment.amount,
      fee: payment.fee,
      total_cost: payment.totalCost,
    }),
  });

  const orderCreated = Boolean(orderRes.ok);
  if (orderCreated) {
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

  const paymentRes = await apiFetchWithToken<{ ok?: boolean }>(`/pi/payments`, {
    method: "POST",
    body: JSON.stringify({
      amount: paymentAmount,
      memo: TRADE_COPY.sendPiMemo,
      metadata: { userId },
    }),
  });

  const paymentCreated = Boolean(paymentRes.ok);
  if (paymentCreated) {
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

  onStageChange?.("awaiting_pi_confirmation");

  let paymentIdRef: string | undefined;
  let txidRef: string | undefined;
  let positionRecorded = false;
  let succeeded = false;
  let failureReason: TradeFailureReason | undefined;
  let status: ExecuteBuyTradeResult["status"];
  status = "failed";

  await pi.createPayment(
    {
      amount: paymentAmount,
      memo: TRADE_COPY.sendPiMemo,
      metadata: { userId },
    },
    {
      onReadyForServerApproval: async (paymentId: string) => {
        paymentIdRef = paymentId;
        await apiFetchWithToken(`/pi/payments/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentId }),
        });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        paymentIdRef = paymentId;
        txidRef = txid;
        onStageChange?.("payment_detected");

        const completeRes = await apiFetchWithToken<{ status?: string }>(`/pi/payments/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentId, txid }),
        });

        if (completeRes.status === "completed") {
          const positionRes = await apiFetchWithToken<{ ok?: boolean }>(`/positions`, {
            method: "POST",
            body: JSON.stringify({
              market_id: marketId,
              side: sideLower,
              shares: payment.shares,
              price: payment.price,
              amount: payment.amount,
              fee: payment.fee,
              total_cost: payment.totalCost,
            }),
          });

          if (positionRes.ok) {
            positionRecorded = true;
            onStageChange?.("position_recorded");
            onPositionCreated?.();
            onStageChange?.("prediction_confirmed");
            succeeded = true;
            status = "confirmed";

            toast({
              title: TRADE_COPY.sendPiSuccessTitle,
              description: TRADE_COPY.sendPiSuccessDescription(paymentAmount),
            });
          } else {
            failureReason = "payment_detected_position_not_recorded";
            status = "failed";
            toast({
              title: "Position Recording Failed",
              description: "Payment was detected, but we could not record your position.",
              variant: "destructive",
            });
          }
        } else {
          failureReason = "position_recorded_confirmation_delayed";
          status = "failed";
          toast({
            title: TRADE_COPY.sendPiFailedTitle,
            description: TRADE_COPY.sendPiFailedConfirmation(paymentAmount),
            variant: "destructive",
          });
        }
      },
      onCancel: async (paymentId: string) => {
        paymentIdRef = paymentId;
        failureReason = "payment_cancelled";
        status = "cancelled";

        const cancelRes = await apiFetchWithToken<{ status?: string }>(`/pi/payments/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentId }),
        });

        if (cancelRes.status === "cancelled") {
          toast({
            title: TRADE_COPY.sendPiFailedTitle,
            description: TRADE_COPY.sendPiFailedCancelled,
            variant: "destructive",
          });
        }
      },
      onError: (error: unknown) => {
        console.error(error);
        failureReason = "network_error";
        status = "failed";

        toast({
          title: TRADE_COPY.sendPiFailedTitle,
          description: TRADE_COPY.sendPiFailedError,
          variant: "destructive",
        });
      },
    }
  );

  return {
    success: succeeded,
    status,
    paymentId: paymentIdRef,
    txid: txidRef,
    orderCreated,
    paymentCreated,
    positionRecorded,
    totalCost: paymentAmount,
    failureReason:
      failureReason ??
      (succeeded ? undefined : "payment_pending"),
  } satisfies ExecuteBuyTradeResult;
}

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

  onStageChange?.("preparing_payment");

  const scopes = ["payments"];
  // Buffered because the callback fires inside authenticate(), before we hold the
  // Pi access token that /pi/payments/incomplete authenticates against.
  let danglingPayment: unknown;
  const onIncompletePaymentFound = (paymentRecord: unknown) => {
    danglingPayment = paymentRecord;
  };

  const pi = getPi();
  const authResult = await pi.authenticate(scopes, onIncompletePaymentFound);
  const piAccessToken: string | undefined = (authResult as any)?.accessToken;

  if (danglingPayment && piAccessToken) {
    const res = await apiFetch<{ status?: string }>(`/pi/payments/incomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${piAccessToken}`,
      },
      body: JSON.stringify({ payment: danglingPayment }),
    });

    if (res.status === "handled") {
      toast({
        title: "Uncompleted payment found",
        description: "A previous payment is still pending.",
        variant: "destructive",
      });
    }
  }

  const orderRes = await apiFetchWithToken<{ ok?: boolean; data?: { id?: number } }>(`/orders`, {
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

  const orderId = orderRes.data?.id;
  const orderCreated = Boolean(orderRes.ok && orderId);
  if (!orderCreated || orderId === undefined) {
    toast({
      title: "Order creation failed",
      description: "Failed to create order",
      variant: "destructive",
    });
    throw new Error("Order creation failed");
  }

  toast({
    title: "Order created",
    description: "Order created successfully",
  });

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
      // order_id travels with the payment so the server can bind the two.
      metadata: { order_id: orderId, userId },
    },
    {
      onReadyForServerApproval: async (paymentId: string) => {
        paymentIdRef = paymentId;
        await apiFetchWithToken(`/pi/payments/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentId, order_id: orderId }),
        });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        paymentIdRef = paymentId;
        txidRef = txid;
        onStageChange?.("payment_detected");

        // Settlement is server-side: completing the payment also records the
        // trade, the position and the new market price, in one transaction.
        const completeRes = await apiFetchWithToken<{ status?: string }>(`/pi/payments/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentId, txid }),
        });

        if (completeRes.status === "completed") {
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
    positionRecorded,
    totalCost: paymentAmount,
    failureReason:
      failureReason ??
      (succeeded ? undefined : "payment_pending"),
  } satisfies ExecuteBuyTradeResult;
}

"use client";

import { apiFetch, apiFetchWithToken } from "@/lib/api";
import { getPi } from "@/lib/pi";

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

  onStageChange?.("preparing_payment");

  const scopes = ["payments"];
  const onIncompletePaymentFound = async (payment: unknown) => {
    const res = await apiFetch<{ status?: string }>(`/pi/payments/incomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payment }),
    });

    if (res.status === "handled") {
      toast({
        title: "Uncompleted payment found",
        description: String(payment),
        variant: "destructive",
      });
    }
  };

  const pi = getPi();
  await pi.authenticate(scopes, onIncompletePaymentFound);

  const orderRes = await apiFetchWithToken<{ ok?: boolean }>(`/orders`, {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      market_id: marketId,
      side: "BUY",
      outcome,
      price,
      size: shares,
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
      amount: shares,
      memo: "Deposit to Pi Predict",
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
      amount: shares,
      memo: "Deposit to Pi Predict",
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
              side: outcome,
              amount: shares,
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
              title: "Deposit Successful",
              description: `Successfully deposited ${shares} π from your wallet.`,
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
            title: "Deposit Failed",
            description: `Could not complete ${shares} π deposit confirmation.`,
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
            title: "Deposit Failed",
            description: "The deposit was cancelled or failed. Please try again.",
            variant: "destructive",
          });
        }
      },
      onError: (error: unknown) => {
        console.error(error);
        failureReason = "network_error";
        status = "failed";

        toast({
          title: "Deposit Failed",
          description: "An error occurred during the deposit. Please try again.",
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
    failureReason:
      failureReason ??
      (succeeded ? undefined : "payment_pending"),
  } satisfies ExecuteBuyTradeResult;
}

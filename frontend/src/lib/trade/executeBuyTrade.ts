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
};

export async function executeBuyTrade({
  userId,
  marketId,
  outcome,
  price,
  shares,
  toast,
  onPositionCreated,
}: ExecuteBuyTradeParams) {
  if (!Number.isFinite(shares) || shares <= 0) {
    throw new Error("Invalid shares amount");
  }

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

  if (orderRes.ok) {
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
      metadata: { userId },
    },
    {
      onReadyForServerApproval: async (paymentId: string) => {
        await apiFetchWithToken(`/pi/payments/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentId }),
        });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
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
            onPositionCreated?.();
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
      onCancel: async (paymentId: string) => {
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
        toast({
          title: "Deposit Failed",
          description: "An error occurred during the deposit. Please try again.",
          variant: "destructive",
        });
      },
    }
  );
}

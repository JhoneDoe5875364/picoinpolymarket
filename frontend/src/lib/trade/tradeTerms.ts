"use client";

import { FEE } from "@/lib/constants";

export const TRADE_TERMS = {
  amount: "Amount",
  fee: "Fee",
  totalCost: "Total Cost",
  estimatedReturn: "Estimated Return",
  netResult: "Net Result",
  lossIfIncorrect: "Loss if Incorrect",
} as const;

export type TradeBreakdown = {
  amount: number;
  fee: number;
  totalCost: number;
  estimatedReturn: number;
  netResult: number;
  lossIfIncorrect: number;
};

export function sanitizeShares(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value;
}

export function calculateTradeBreakdown(price: number, rawShares: number): TradeBreakdown {
  const shares = sanitizeShares(rawShares);
  const safePrice = Number.isFinite(price) && price > 0 ? price : 0;
  const amount = safePrice * shares;
  const fee = amount * FEE;
  const totalCost = amount + fee;
  const estimatedReturn = shares;
  const netResult = estimatedReturn - totalCost;

  return {
    amount,
    fee,
    totalCost,
    estimatedReturn,
    netResult,
    lossIfIncorrect: totalCost,
  };
}

/** Round Pi amounts to 4 decimal places for API / payment consistency. */
export function roundPiAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10000) / 10000;
}

export type TradePaymentPayload = {
  shares: number;
  price: number;
  amount: number;
  fee: number;
  totalCost: number;
};

/** Single source for order, Pi payment, and position requests. */
export function buildTradePaymentPayload(price: number, rawShares: number): TradePaymentPayload {
  const breakdown = calculateTradeBreakdown(price, rawShares);
  return {
    shares: roundPiAmount(breakdown.estimatedReturn),
    price: roundPiAmount(price),
    amount: roundPiAmount(breakdown.amount),
    fee: roundPiAmount(breakdown.fee),
    totalCost: roundPiAmount(breakdown.totalCost),
  };
}

export function formatPi(value: number): string {
  return `${value.toFixed(2)} π`;
}

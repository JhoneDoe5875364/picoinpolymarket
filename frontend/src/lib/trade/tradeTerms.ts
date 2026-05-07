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

export function formatPi(value: number): string {
  return `${value.toFixed(2)} π`;
}

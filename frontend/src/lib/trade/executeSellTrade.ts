"use client";

import { apiFetchWithToken } from "@/lib/api";

/**
 * Sell (close) a position. Unlike a BUY, the client never talks to the Pi
 * payment SDK: the server sends the proceeds back to the user's wallet via A2U.
 * We just POST the request with a client-generated idempotency key so a retry
 * (double-click, flaky network) never triggers a second on-chain payout.
 */

export type SellTradeParams = {
  positionId: number | string;
  sellShares: number;
  expectedPrice?: number;
};

export type SellTradeResult = {
  ok: boolean;
  txid?: string;
  netPayout?: number;
  price?: number;
  sharesSold?: number;
  remainingShares?: number;
  isClosed?: boolean;
  already?: boolean;
};

function newSellRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID.
  return `sell-${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export async function executeSellTrade({
  positionId,
  sellShares,
  expectedPrice,
}: SellTradeParams): Promise<SellTradeResult> {
  if (!Number.isFinite(sellShares) || sellShares <= 0) {
    throw new Error("Invalid shares amount");
  }

  const body: Record<string, unknown> = {
    sell_shares: sellShares,
    sell_request_id: newSellRequestId(),
  };
  if (expectedPrice !== undefined && Number.isFinite(expectedPrice)) {
    body.expected_price = expectedPrice;
  }

  const res = await apiFetchWithToken<{
    ok?: boolean;
    txid?: string;
    net_payout?: number;
    price?: number;
    shares_sold?: number;
    remaining_shares?: number;
    is_closed?: boolean;
    already?: boolean;
  }>(`/positions/${positionId}/sell`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    ok: Boolean(res?.ok),
    txid: res?.txid,
    netPayout: res?.net_payout,
    price: res?.price,
    sharesSold: res?.shares_sold,
    remainingShares: res?.remaining_shares,
    isClosed: res?.is_closed,
    already: res?.already,
  };
}

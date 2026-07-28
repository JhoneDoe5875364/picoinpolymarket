"use client";

import { apiFetchWithToken } from "@/lib/api";

/**
 * Returns the user's saved payout wallet address, or null if none is set.
 * Trades require this so winnings can be paid out — Pi login never provides it.
 */
export async function fetchPayoutWallet(): Promise<string | null> {
  try {
    const res = await apiFetchWithToken<{
      ok?: boolean;
      info?: { payout_destination?: string | null; wallet_address?: string | null };
    }>("/account/info", { method: "GET" });
    const addr =
      res?.info?.payout_destination?.trim() || res?.info?.wallet_address?.trim();
    return addr || null;
  } catch {
    return null;
  }
}

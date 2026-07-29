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

/**
 * Broadcast that the user's payout wallet changed, so listeners (e.g. the
 * app-wide reminder banner) can re-check without a full page reload. Fired
 * after a successful wallet save.
 */
export const WALLET_UPDATED_EVENT = "ppx:wallet-updated";

export function notifyWalletUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WALLET_UPDATED_EVENT));
}

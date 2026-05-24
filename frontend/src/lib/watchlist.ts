import { apiFetchWithToken } from "@/lib/api";

type ToggleWatchlistResponse = {
  ok?: boolean;
  data?: {
    watched?: boolean;
    market_id?: number;
  };
};

export async function toggleWatchlist(marketId: number): Promise<boolean> {
  const res = await apiFetchWithToken<ToggleWatchlistResponse>(
    `/watchlist/${marketId}/toggle`,
    { method: "POST" }
  );
  return Boolean(res?.data?.watched);
}

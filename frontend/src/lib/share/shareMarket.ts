export type ShareMarketResult = "shared" | "copied" | "failed";

export function buildMarketShareUrl(marketId: number | string): string {
  if (typeof window === "undefined") {
    return `/markets/${marketId}`;
  }
  return `${window.location.origin}/markets/${marketId}`;
}

export async function shareMarket(input: {
  marketId: number | string;
  title: string;
  text?: string;
}): Promise<ShareMarketResult> {
  const url = buildMarketShareUrl(input.marketId);
  const shareText = input.text?.trim() || `Check out this prediction market on PredictPix: ${input.title}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const payload: ShareData = { title: input.title, text: shareText, url };
      if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
        // fall through to clipboard
      } else {
        await navigator.share(payload);
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "failed";
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}

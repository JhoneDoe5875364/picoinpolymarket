import { cn } from "@/lib/utils";

/**
 * Prediction result badge shared by the admin payments/KPI tables and the
 * profile Resolved tab. It answers "how did this prediction end?":
 *   won  – the market resolved to the side this position/payment was on
 *   lost – the market resolved to the other side
 *   sold – the position was closed by selling (never went to resolution)
 *   open – the market has not resolved yet
 */
export type PredictionResult = "won" | "lost" | "sold" | "open";

const STYLES: Record<PredictionResult, { label: string; className: string }> = {
  won: {
    label: "Won",
    className: "border-emerald-600/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  lost: {
    label: "Lost",
    className: "border-rose-600/40 bg-rose-500/15 text-rose-600 dark:text-rose-300",
  },
  sold: {
    label: "Sold",
    className: "border-slate-500/40 bg-slate-500/15 text-slate-600 dark:text-slate-300",
  },
  open: {
    label: "Open",
    className: "border-border bg-muted/40 text-muted-foreground",
  },
};

/**
 * Decide the result for a POSITION using its resolution fields.
 * final_price >= 1 => won, final_price == 0 => lost (both mean resolved),
 * closed with no final_price => sold, otherwise open.
 */
export function positionResult(args: {
  isResolved?: boolean | null;
  finalPrice?: number | null;
  isClosed?: boolean | null;
}): PredictionResult {
  const { finalPrice, isClosed } = args;
  // Pari-mutuel: a winner's final_price is the dividend per share (> 0, and may
  // be below 1), a loser's is exactly 0. final_price is only set at resolution.
  if (finalPrice !== null && finalPrice !== undefined) {
    return finalPrice > 0 ? "won" : "lost";
  }
  if (isClosed) return "sold";
  return "open";
}

export function ResultBadge({ result, className }: { result: PredictionResult; className?: string }) {
  const style = STYLES[result] ?? STYLES.open;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold",
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
}

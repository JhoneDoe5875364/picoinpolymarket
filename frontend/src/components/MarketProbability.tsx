// src/components/MarketProbability.tsx
"use client";

type Props = {
  implied?: number | null | undefined; // 0..1, Yes probability
  yesValue?: number | null;            // optional Pi volume on Yes
  noValue?: number | null;             // optional Pi volume on No
  unit?: string;                       // tooltip unit, default "Pi"
};

export default function MarketProbability({
  implied = 0.5,
  yesValue = null,
  noValue = null,
  unit = "Pi",
}: Props) {
  const p = clamp01(Number(implied));
  const yesPct = Math.round(p * 100);
  const noPct = 100 - yesPct;

  const yesTip =
    `Yes: ${yesPct}%` + (yesValue != null ? ` • ${fmtCompact(yesValue)} ${unit}` : "");
  const noTip =
    `No: ${noPct}%` + (noValue != null ? ` • ${fmtCompact(noValue)} ${unit}` : "");

  return (
    <div className="w-full">
      {/* Labels with brand colors */}
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-cyan-400 font-semibold">Yes: {yesPct}%</span>
        <span className="text-pink-400 font-semibold">No: {noPct}%</span>
      </div>

      {/* Split bar: YES (left) cyan→blue, NO (right) pink→purple */}
      <div className="relative h-3 w-full rounded-full overflow-hidden bg-white/10">
        {/* YES side */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500"
          style={{ width: `${yesPct}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={yesPct}
          aria-label={yesTip}
          title={yesTip}
        />
        {/* NO side */}
        <div
          className="absolute right-0 top-0 h-full bg-gradient-to-r from-pink-400 to-purple-500"
          style={{ width: `${noPct}%` }}
          aria-label={noTip}
          title={noTip}
        />
      </div>
    </div>
  );
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function fmtCompact(n: number) {
  try { return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n); }
  catch { return String(n); }
}

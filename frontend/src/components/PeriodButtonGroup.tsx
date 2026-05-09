"use client";

import { cn } from "@/lib/utils";

export type PeriodButtonKey = "today" | "week" | "month" | "year" | "all";

export const PERIOD_BUTTON_TABS: Array<{ key: PeriodButtonKey; label: string }> = [
  { key: "today", label: "1D" },
  { key: "week", label: "1W" },
  { key: "month", label: "1M" },
  { key: "year", label: "1Y" },
  { key: "all", label: "ALL" },
];

type PeriodButtonGroupProps = {
  selected: PeriodButtonKey;
  onSelect: (key: PeriodButtonKey) => void;
  className?: string;
};

export function PeriodButtonGroup({ selected, onSelect, className }: PeriodButtonGroupProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-2xl border border-border overflow-hidden",
        className,
      )}
    >
      {PERIOD_BUTTON_TABS.map((period) => (
        <div
          key={period.key}
          role="button"
          tabIndex={0}
          aria-pressed={selected === period.key}
          onClick={() => onSelect(period.key)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(period.key);
            }
          }}
          className={`px-3 py-1 text-xs font-medium cursor-pointer select-none border-r border-border last:border-r-0 first:rounded-l-md last:rounded-r-md ${
            selected === period.key
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground hover:bg-muted/60"
          }`}
        >
          {period.label}
        </div>
      ))}
    </div>
  );
}

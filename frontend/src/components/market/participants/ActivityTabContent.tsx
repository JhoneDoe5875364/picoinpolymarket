import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  InitialAvatar,
  ListSkeleton,
  getDisplayName,
  normalizeNumber,
  outcomeColor,
  outcomeText,
} from "./shared";
import type { MarketTradeActivity, MinAmountFilter } from "./types";
import { formatRelativeTime, toUnsignedMoney } from "@/lib/utils";

interface ActivityTabContentProps {
  activityLoading: boolean;
  minAmount: MinAmountFilter;
  filteredActivityRows: MarketTradeActivity[];
  onMinAmountChange: (value: MinAmountFilter) => void;
}

export function ActivityTabContent({
  activityLoading,
  minAmount,
  filteredActivityRows,
  onMinAmountChange,
}: ActivityTabContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={minAmount} onValueChange={(value) => onMinAmountChange(value as MinAmountFilter)}>
          <SelectTrigger className="h-9 w-[140px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            <SelectItem value="10">10π</SelectItem>
            <SelectItem value="100">100π</SelectItem>
            <SelectItem value="1000">1,000π</SelectItem>
            <SelectItem value="10000">10,000π</SelectItem>
            <SelectItem value="100000">100,000π</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activityLoading ? (
        <ListSkeleton />
      ) : filteredActivityRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {filteredActivityRows.map((row, idx) => {
            const name = row.taker_pi_username || "";
            const shares = normalizeNumber(row.shares);
            const price = normalizeNumber(row.price);
            const piAmount = normalizeNumber(row.pi_amount);
            const outcome = String(row.outcome || "").toUpperCase() === "YES" ? "Yes" : "No";
            return (
              <li key={`${row.id}-${idx}`} className="flex items-start items-center justify-between gap-1 py-2">
                <div className="flex min-w-0 items-center gap-1">
                  <InitialAvatar name={name} size="sm" />
                  <p className="truncate text-[12px] text-foreground/90">
                    <span className="font-semibold">{name}</span>{" "}
                    <span className="text-muted-foreground">{outcomeText(row.outcome)}</span>{" "}
                    <span className={outcomeColor(row.outcome)}>{shares.toLocaleString()} {outcome}</span>{" "}
                    <span className="text-muted-foreground">at</span>{" "}
                    <span className="font-semibold">{toUnsignedMoney(price)}</span>{" "}
                    <span className="text-muted-foreground">({toUnsignedMoney(piAmount)})</span>
                  </p>
                </div>
                <p className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  {formatRelativeTime(row.created_at)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

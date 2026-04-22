import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDisplayName, ListSkeleton, normalizeNumber, RankedAvatar } from "./shared";
import type { MarketPosition, PositionStatus, SortDirection } from "./types";
import { toUnsignedMoney } from "@/lib/utils";

const TOP_LIST_LIMIT = 20;

interface PositionsTabContentProps {
  positionsLoading: boolean;
  yesPositions: MarketPosition[];
  noPositions: MarketPosition[];
  positionStatus: PositionStatus;
  sortDirection: SortDirection;
  onPositionStatusChange: (value: PositionStatus) => void;
  onSortDirectionChange: (value: SortDirection) => void;
}

function PositionColumn({
  title,
  rows,
  valueClassName,
  keyPrefix,
  withDivider = false,
}: {
  title: string;
  rows: MarketPosition[];
  valueClassName: string;
  keyPrefix: string;
  withDivider?: boolean;
}) {
  return (
    <div className={`space-y-3 ${withDivider ? "border-l border-border pl-4" : ""}`}>
      <h4 className="border-b border-border pb-3 text-sm font-semibold tracking-tight text-foreground/90">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No positions found.</p>
      ) : (
        <ul className="space-y-2 pt-2">
          {rows.slice(0, TOP_LIST_LIMIT).map((position, idx) => {
            const username = position.pi_username || "";
            const piAmount = normalizeNumber(position.pi_amount);
            const shares = normalizeNumber(position.shares);
            const avgPrice = piAmount / Math.max(shares, 1);

            return (
              <li key={`${position.id}-${keyPrefix}-${idx}`} className="flex items-start gap-1">
                <RankedAvatar name={username} rank={idx + 1} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1">
                    <p className="truncate text-[12px] font-medium">{username}</p>
                    <p className="shrink-0 text-[10px] text-muted-foreground">avg {toUnsignedMoney(avgPrice)}</p>
                  </div>
                  <p className={`text-[12px] font-semibold ${valueClassName}`}>{toUnsignedMoney(piAmount)}</p>
                  <p className="text-[11px] text-muted-foreground">{shares.toLocaleString()} shares</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function PositionsTabContent({
  positionsLoading,
  yesPositions,
  noPositions,
  positionStatus,
  sortDirection,
  onPositionStatusChange,
  onSortDirectionChange,
}: PositionsTabContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select value={positionStatus} onValueChange={(value) => onPositionStatusChange(value as PositionStatus)}>
          <SelectTrigger className="h-9 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortDirection} onValueChange={(value) => onSortDirectionChange(value as SortDirection)}>
          <SelectTrigger className="h-9 w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DESC">Desc</SelectItem>
            <SelectItem value="ASC">Asc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {positionsLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <ListSkeleton />
          <ListSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <PositionColumn title="Yes" rows={yesPositions} valueClassName="text-emerald-400" keyPrefix="YES" />
          <PositionColumn title="No" rows={noPositions} valueClassName="text-rose-400" keyPrefix="NO" withDivider />
        </div>
      )}
    </div>
  );
}

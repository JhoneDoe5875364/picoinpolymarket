import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListSkeleton, PositionColumn } from "./shared";
import type { MarketPosition, PositionStatus, SortDirection } from "./types";

interface PositionsTabContentProps {
  positionsLoading: boolean;
  yesPositions: MarketPosition[];
  noPositions: MarketPosition[];
  positionStatus: PositionStatus;
  sortDirection: SortDirection;
  onPositionStatusChange: (value: PositionStatus) => void;
  onSortDirectionChange: (value: SortDirection) => void;
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
        <div className="grid grid-cols-2 gap-8">
          <ListSkeleton />
          <ListSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          <PositionColumn title="Yes" rows={yesPositions} valueClassName="text-emerald-400" keyPrefix="YES" />
          <PositionColumn title="No" rows={noPositions} valueClassName="text-rose-400" keyPrefix="NO" withDivider />
        </div>
      )}
    </div>
  );
}

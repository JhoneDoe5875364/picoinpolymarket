import { HolderColumn, ListSkeleton } from "./shared";
import type { MarketHolder } from "./types";

interface TopHoldersTabContentProps {
  holdersLoading: boolean;
  yesHolders: MarketHolder[];
  noHolders: MarketHolder[];
}

export function TopHoldersTabContent({ holdersLoading, yesHolders, noHolders }: TopHoldersTabContentProps) {
  if (holdersLoading) {
    return (
      <div className="grid grid-cols-2 gap-8">
        <ListSkeleton />
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      <HolderColumn title="Yes holders" rows={yesHolders} valueClassName="text-emerald-400" />
      <HolderColumn title="No holders" rows={noHolders} valueClassName="text-rose-400" withDivider />
    </div>
  );
}

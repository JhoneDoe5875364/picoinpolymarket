import { getDisplayName, ListSkeleton, normalizeNumber, RankedAvatar } from "./shared";
import type { MarketHolder } from "./types";

const TOP_LIST_LIMIT = 20;

interface TopHoldersTabContentProps {
  holdersLoading: boolean;
  yesHolders: MarketHolder[];
  noHolders: MarketHolder[];
}

function HolderColumn({
  title,
  rows,
  valueClassName,
  withDivider = false,
}: {
  title: string;
  rows: MarketHolder[];
  valueClassName: string;
  withDivider?: boolean;
}) {
  return (
    <div className={`space-y-3 ${withDivider ? "border-l border-border pl-4" : ""}`}>
      <h4 className="border-b border-border pb-3 text-sm font-semibold tracking-tight text-foreground/90">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No holders</p>
      ) : (
        <ul className="space-y-2 pt-2">
          {rows.slice(0, TOP_LIST_LIMIT).map((holder, idx) => {
            const username = holder.pi_username || "";
            return (
              <li key={`${holder.user_id}-${idx}`} className="flex items-start gap-2">
                <RankedAvatar name={username} rank={idx + 1} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium">{username}</p>
                  <p className={`text-[12px] font-semibold ${valueClassName}`}>
                    {normalizeNumber(holder.shares).toLocaleString()} shares
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function TopHoldersTabContent({ holdersLoading, yesHolders, noHolders }: TopHoldersTabContentProps) {
  if (holdersLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <ListSkeleton />
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <HolderColumn title="Yes holders" rows={yesHolders} valueClassName="text-emerald-400" />
      <HolderColumn title="No holders" rows={noHolders} valueClassName="text-rose-400" withDivider />
    </div>
  );
}

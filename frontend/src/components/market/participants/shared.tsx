import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketHolder, MarketPosition } from "./types";

const TOP_LIST_LIMIT = 7;

export function normalizeNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function getDisplayName(userId: string | number): string {
  const raw = String(userId ?? "");
  if (!raw) return "unknown";
  if (/^[A-Za-z0-9_.-]{3,}$/.test(raw) && /[A-Za-z]/.test(raw)) return raw;
  if (raw.length > 8) return `${raw.slice(0, 4)}...${raw.slice(-3)}`;
  return `user-${raw}`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase() || "?";
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  const sec = Math.max(Math.floor(diffMs / 1000), 0);
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function outcomeColor(outcome?: string): string {
  return String(outcome).toUpperCase() === "YES" ? "text-emerald-400" : "text-rose-400";
}

export function outcomeText(side?: string): string {
  return String(side).toUpperCase() === "SELL" ? "sold" : "bought";
}

export function InitialAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <Avatar className={size === "sm" ? "h-8 w-8" : "h-9 w-9"}>
      <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 via-cyan-500 to-emerald-400 text-[11px] font-semibold text-white">
        {getInitial(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function RankedAvatar({ name, rank, size = "md" }: { name: string; rank: number; size?: "sm" | "md" }) {
  return (
    <div className="relative">
      <InitialAvatar name={name} size={size} />
      <Badge
        variant="secondary"
        className={`absolute -left-2 -top-2 h-5 min-w-5 rounded-full border border-border bg-background px-1 text-[10px] font-bold leading-none ${rankColor(rank)}`}
      >
        {rank}
      </Badge>
    </div>
  );
}

export function HolderColumn({
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
    <div className={`space-y-3 ${withDivider ? "border-l border-border pl-6" : ""}`}>
      <h4 className="border-b border-border pb-3 text-sm font-semibold tracking-tight text-foreground/90">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No holders</p>
      ) : (
        <ul className="space-y-2 pt-2">
          {rows.slice(0, TOP_LIST_LIMIT).map((holder, idx) => {
            const name = getDisplayName(holder.user_id);
            return (
              <li key={`${holder.user_id}-${idx}`} className="flex items-start gap-2">
                <RankedAvatar name={name} rank={idx + 1} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium">{name}</p>
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

export function PositionColumn({
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
    <div className={`space-y-3 ${withDivider ? "border-l border-border pl-6" : ""}`}>
      <h4 className="border-b border-border pb-3 text-sm font-semibold tracking-tight text-foreground/90">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No positions found.</p>
      ) : (
        <ul className="space-y-2 pt-2">
          {rows.slice(0, TOP_LIST_LIMIT).map((position, idx) => {
            const name = getDisplayName(position.user_id);
            const amount = normalizeNumber(position.pi_amount);
            const shares = normalizeNumber(position.shares);
            const avgPrice = amount / Math.max(shares, 1);

            return (
              <li key={`${position.id}-${keyPrefix}-${idx}`} className="flex items-start gap-2">
                <RankedAvatar name={name} rank={idx + 1} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-[12px] font-medium">{name}</p>
                    <p className="shrink-0 text-[11px] text-muted-foreground">avg {avgPrice.toFixed(2)}</p>
                  </div>
                  <p className={`text-[12px] font-semibold ${valueClassName}`}>
                    π{amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
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

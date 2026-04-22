import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


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

export function RankedAvatar({ name, rank, size = "md" }: { name: string; rank: number; size?: "sm" | "md" }) {
  return (
    <div className="relative">
      <InitialAvatar name={name} size={size} />
      <Badge
        variant="secondary"
        className={`absolute -left-1 -top-1 h-5 min-w-5 rounded-full border border-border bg-background px-1 text-[12px] font-bold leading-none ${rankColor(rank)}`}
      >
        {rank}
      </Badge>
    </div>
  );
}

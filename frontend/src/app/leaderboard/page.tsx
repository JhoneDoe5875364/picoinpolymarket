"use client";

import { apiFetch } from "@/lib/api";
import { cn, toNumber } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

type TimeFilter = "daily" | "weekly" | "monthly" | "all";
type MetricFilter = "pnl" | "volume";

type ApiLeaderboardEntry = {
  rank?: number;
  user_id?: number | string;
  pi_user_id?: string | null;
  pi_username?: string | null;
  profile_image?: string | null;
  profile_image_url?: string | null;
  pi_profile_image?: string | null;
  avatar_url?: string | null;
  wallet_address?: string | null;
  vol?: number | string | null;
  pnl?: number | string | null;
};

type LeaderboardEntry = {
  entryKey: string;
  rank: number;
  userId: string;
  username: string;
  profileImageUrl: string | null;
  profitLoss: number;
  volume: number;
};

const TIME_OPTIONS: Array<{ key: TimeFilter; label: string; bucket: string }> = [
  { key: "daily", label: "Daily", bucket: "1D" },
  { key: "weekly", label: "Weekly", bucket: "1W" },
  { key: "monthly", label: "Monthly", bucket: "1M" },
  { key: "all", label: "All Time", bucket: "ALL" },
];

const METRIC_OPTIONS: Array<{ key: MetricFilter; label: string }> = [
  { key: "pnl", label: "Net Result (PnL)" },
  { key: "volume", label: "Volume" },
];

function getAvatarGradient(seed: string) {
  const palette = [
    "from-violet-500 via-blue-500 to-emerald-300",
    "from-fuchsia-500 via-pink-500 to-indigo-400",
    "from-cyan-400 via-blue-500 to-purple-500",
    "from-green-400 via-emerald-400 to-fuchsia-400",
  ];
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

function formatAmount(amount: number) {
  const rounded = Math.round(amount);
  return `${rounded >= 0 ? "+" : "-"}π${Math.abs(rounded).toLocaleString()}`;
}

function formatVolume(volume: number) {
  return `π${Math.round(volume).toLocaleString()}`;
}

function mapApiLeaderboardEntries(items: ApiLeaderboardEntry[]) {
  return items.map((item, idx) => {
    const userId = String(item.pi_user_id ?? item.user_id ?? item.wallet_address ?? "unknown");
    return {
      entryKey: `${userId}-${idx}`,
      rank: Number(item.rank ?? idx + 1),
      userId,
      username: item.pi_username ?? userId,
      profileImageUrl:
        item.profile_image ??
        item.profile_image_url ??
        item.pi_profile_image ??
        item.avatar_url ??
        null,
      profitLoss: toNumber(item.pnl),
      volume: toNumber(item.vol),
    };
  });
}

function sortEntries(entries: LeaderboardEntry[], selectedMetric: MetricFilter) {
  const sorted = [...entries].sort((a, b) =>
    selectedMetric === "pnl" ? b.profitLoss - a.profitLoss : b.volume - a.volume
  );
  return sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

function getPodiumBadge(rank: number) {
  if (rank === 1) {
    return <Crown className="h-4 w-4 text-amber-400" />;
  }
  return <Medal className="h-4 w-4 text-amber-400" />;
}

function getPodiumCardBg(rank: number) {
  if (rank === 1) return "border-amber-300/45 bg-gradient-to-b from-amber-300/35 to-amber-500/10";
  if (rank === 2) return "border-slate-300/45 bg-gradient-to-b from-slate-300/30 to-slate-500/10";
  if (rank === 3) return "border-orange-300/45 bg-gradient-to-b from-orange-300/35 to-orange-500/10";
  return "border-border bg-card";
}

function PodiumCard({
  entry,
  emphasized,
}: {
  entry?: LeaderboardEntry;
  emphasized: boolean;
}) {
  if (!entry) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4",
          emphasized ? "min-h-[196px] md:min-h-[220px]" : "min-h-[176px] md:min-h-[196px]"
        )}
      />
    );
  }

  const avatarSizeClass = emphasized ? "h-20 w-20 md:h-24 md:w-24" : "h-16 w-16";
  const initial = entry.username.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "rounded-xl border p-2",
        getPodiumCardBg(entry.rank),
        emphasized && "shadow-[0_0_0_1px_rgba(125,211,252,0.18)]"
      )}
    >
      <div className="mb-3 text-center gap-2">
        <p className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {getPodiumBadge(entry.rank)}
          #{entry.rank}
        </p>
        {entry.profileImageUrl ? (
          <img
            src={entry.profileImageUrl}
            alt={`${entry.username} profile`}
            className={cn("mx-auto mt-2 rounded-full object-cover", avatarSizeClass)}
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "mx-auto mt-2 rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white",
              avatarSizeClass,
              emphasized ? "text-2xl" : "text-xl",
              getAvatarGradient(entry.userId)
            )}
          >
            {initial}
          </div>
        )}
        <p className="mt-2 text-sm font-semibold text-foreground truncate">{entry.username}</p>
        <p className={cn("mt-1 text-xs", entry.profitLoss >= 0 ? "text-green-500" : "text-red-500")}>
          {formatAmount(entry.profitLoss)} Net
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatVolume(entry.volume)} Vol</p>
      </div>
    </div>
  );
}

function MyRankCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="rounded-xl border border-cyan-300/30 bg-card/80 p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {entry.profileImageUrl ? (
            <img
              src={entry.profileImageUrl}
              alt={`${entry.username} profile`}
              className="h-12 w-12 shrink-0 rounded-full border border-cyan-300/40 object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={cn(
                "h-12 w-12 shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-base font-semibold text-white",
                getAvatarGradient(entry.userId)
              )}
            >
              {entry.username.trim().charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">My Account</p>
            <p className="truncate text-base font-semibold text-foreground md:text-lg">{entry.username}</p>
          </div>
        </div>
        <span className="inline-flex h-10 min-w-16 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/15 px-3 text-sm font-bold text-foreground">
          #{entry.rank}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:gap-3">
        <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Vol</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground md:text-base">{formatVolume(entry.volume)}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Net</p>
          <p
            className={cn(
              "mt-0.5 text-sm font-semibold md:text-base",
              entry.profitLoss >= 0 ? "text-green-500" : "text-red-500"
            )}
          >
            {formatAmount(entry.profitLoss)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { ppxUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedTime, setSelectedTime] = useState<TimeFilter>("daily");
  const [selectedMetric, setSelectedMetric] = useState<MetricFilter>("pnl");

  useEffect(() => {
    let isActive = true;

    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const bucket = TIME_OPTIONS.find((option) => option.key === selectedTime)?.bucket ?? "1D";
        const queryParams = new URLSearchParams(
          {
            category: "All",
            time_bucket: bucket,
            order_by: selectedMetric === "pnl" ? "PNL" : "VOL",
            limit: "20",
            offset: "0",
          }
        );
        const response = await apiFetch<{ ok: boolean; data: ApiLeaderboardEntry[] }>(
          `/leaderboard?${queryParams.toString()}`,
          { method: "GET" }
        ).catch(() => ({ ok: false, data: [] }));

        if (!isActive) return;
        setEntries(mapApiLeaderboardEntries(response.data ?? []));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadEntries();
    return () => {
      isActive = false;
    };
  }, [selectedMetric, selectedTime]);

  const sortedEntries = useMemo(() => sortEntries(entries, selectedMetric), [entries, selectedMetric]);
  const topThree = sortedEntries.slice(0, 3);
  const podiumEntries: Array<LeaderboardEntry | undefined> = [topThree[1], topThree[0], topThree[2]];
  const tableEntries = sortedEntries.slice(3);
  const myEntry = useMemo(() => {
    if (!ppxUser) {
      return null;
    }
    const myId = String(ppxUser.id);
    const myUsername = ppxUser.username.toLowerCase();
    return (
      sortedEntries.find(
        (entry) =>
          entry.userId === myId || entry.username.toLowerCase() === myUsername
      ) ?? null
    );
  }, [ppxUser, sortedEntries]);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-5">
        <h1 className="text-3xl font-bold text-primary md:text-4xl">Leaderboard</h1>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((option) => (
              <Button
                key={option.key}
                variant={selectedTime === option.key ? "secondary" : "ghost"}
                className={cn(
                  "h-9 rounded-full px-4 text-sm transition-colors",
                  selectedTime === option.key
                    ? "border border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => setSelectedTime(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {METRIC_OPTIONS.map((option) => (
              <Button
                key={option.key}
                variant={selectedMetric === option.key ? "secondary" : "ghost"}
                className={cn(
                  "h-9 rounded-full px-4 text-sm transition-colors",
                  selectedMetric === option.key
                    ? "border border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => setSelectedMetric(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground md:text-base">Top 3 Podium</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="self-end">
                <PodiumCard emphasized={false} />
              </div>
              <div>
                <PodiumCard emphasized />
              </div>
              <div className="self-end">
                <PodiumCard emphasized={false} />
              </div>
            </div>
          ) : topThree.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="The podium is still open"
              description="No one has ranked in this category and time range yet. Make a prediction and you could be the first to claim a spot."
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {podiumEntries.map((entry, idx) => (
                <div key={idx} className={idx === 1 ? "" : "self-end"}>
                  <PodiumCard entry={entry} emphasized={idx === 1} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-cyan-500/10 p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground md:text-base">My Rank</h2>
          {isLoading ? (
            <div className="h-16 animate-pulse rounded-md bg-secondary/40" />
          ) : myEntry ? (
            <MyRankCard entry={myEntry} />
          ) : (
            <p className="text-sm text-muted-foreground">
              You have not ranked in this category and time range yet. Place a prediction here and
              your rank will show up once it is scored.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 md:px-6">
            <h2 className="text-sm font-semibold text-foreground md:text-base">Rankings</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-4 md:p-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-11 animate-pulse rounded-md bg-secondary/40 md:h-12" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 p-2 text-center">Rank</TableHead>
                  <TableHead className="p-2">Trader</TableHead>
                  <TableHead className="text-right p-2 text-center">
                    {selectedMetric === "volume" ? "Volume" : "Net Result"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                      No additional ranked traders.
                    </TableCell>
                  </TableRow>
                ) : (
                  tableEntries.map((entry) => (
                    <TableRow key={entry.entryKey}>
                      <TableCell className="text-muted-foreground text-center p-2">{entry.rank}</TableCell>
                      <TableCell className="p-2">
                        <div className="flex min-w-0 items-center gap-3">
                          {entry.profileImageUrl ? (
                            <img
                              src={entry.profileImageUrl}
                              alt={`${entry.username} profile`}
                              className="h-9 w-9 shrink-0 rounded-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className={cn(
                                "h-9 w-9 shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-semibold text-white",
                                getAvatarGradient(entry.userId)
                              )}
                            >
                              {entry.username.trim().charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{entry.username}</p>
                            {selectedMetric === "volume" ? (
                              <p
                                className={cn(
                                  "text-xs",
                                  entry.profitLoss >= 0 ? "text-green-500" : "text-red-500"
                                )}
                              >
                                Net {formatAmount(entry.profitLoss)}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Vol {formatVolume(entry.volume)}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      {selectedMetric === "volume" ? (
                        <TableCell className="text-right font-medium text-primary text-center p-2">
                          {formatVolume(entry.volume)}
                        </TableCell>
                      ) : (
                        <TableCell className="text-right font-medium text-primary text-center p-2">
                          {formatAmount(entry.profitLoss)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  );
}

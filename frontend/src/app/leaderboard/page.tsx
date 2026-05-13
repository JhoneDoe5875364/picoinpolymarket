"use client";

import { apiFetch } from "@/lib/api";
import { cn, toNumber } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Search, Trophy, ChevronDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TimeFilter = "today" | "weekly" | "monthly" | "all";
type SortFilter = "pnl" | "volume";

type ApiLeaderboardEntry = {
  rank?: number;
  user_id?: number | string;
  pi_user_id?: string | null;
  pi_username?: string | null;
  wallet_address?: string | null;
  vol?: number | string | null;
  pnl?: number | string | null;
};

type LeaderboardEntry = {
  entryKey: string;
  rank: number;
  userId: string;
  username: string;
  profitLoss: number;
  volume: number;
};

const TIME_OPTIONS: Array<{ key: TimeFilter; label: string; bucket: string }> = [
  { key: "today", label: "Today", bucket: "1D" },
  { key: "weekly", label: "Weekly", bucket: "1W" },
  { key: "monthly", label: "Monthly", bucket: "1M" },
  { key: "all", label: "All", bucket: "ALL" },
];

const CATEGORY_OPTIONS = [
  { value: "All", label: "All Categories" },
  { value: "Politics", label: "Politics" },
  { value: "Sports", label: "Sports" },
  { value: "Crypto", label: "Crypto" },
  { value: "Esports", label: "Esports" },
  { value: "Finance", label: "Finance" },
  { value: "Geopolitics", label: "Geopolitics" },
  { value: "Tech", label: "Tech" },
  { value: "Culture", label: "Culture" },
  { value: "Economy", label: "Economy" },
  { value: "Weather", label: "Weather" },
];

const SORT_OPTIONS: Array<{ key: SortFilter; label: string }> = [
  { key: "pnl", label: "Profit/Loss" },
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

function truncateUsernameForMobile(username: string) {
  return username.length > 30 ? `${username.slice(0, 30)}...` : username;
}

function mapApiLeaderboardEntries(items: ApiLeaderboardEntry[]) {
  return items.map((item, idx) => {
    const userId = String(item.pi_user_id ?? item.user_id ?? item.wallet_address ?? "unknown");
    return {
      entryKey: `${userId}-${idx}`,
      rank: Number(item.rank ?? idx + 1),
      userId,
      username: item.pi_username ?? userId,
      profitLoss: toNumber(item.pnl),
      volume: toNumber(item.vol),
    };
  });
}

function filterAndSortEntries(entries: LeaderboardEntry[], searchQuery: string, selectedSort: SortFilter) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = entries.filter((entry) =>
    entry.username.toLowerCase().includes(normalizedQuery)
  );
  const sorted = [...filtered].sort((a, b) =>
    selectedSort === "pnl" ? b.profitLoss - a.profitLoss : b.volume - a.volume
  );
  return sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

export default function LeaderboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTime, setSelectedTime] = useState<TimeFilter>("today");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSort, setSelectedSort] = useState<SortFilter>("pnl");

  useEffect(() => {
    let isActive = true;

    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const bucket = TIME_OPTIONS.find((option) => option.key === selectedTime)?.bucket ?? "1D";
        const queryParams = new URLSearchParams(
          {
            category: selectedCategory,
            time_bucket: bucket,
            order_by: selectedSort === "pnl" ? "PNL" : "VOL",
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
  }, [selectedCategory, selectedTime, selectedSort]);

  const filteredEntries = useMemo(
    () => filterAndSortEntries(entries, searchQuery, selectedSort),
    [entries, searchQuery, selectedSort]
  );

  const selectedSortLabel = SORT_OPTIONS.find((option) => option.key === selectedSort)?.label ?? "Profit/Loss";
  const selectedTimeLabel = TIME_OPTIONS.find((option) => option.key === selectedTime)?.label ?? "Monthly";
  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find((option) => option.value === selectedCategory)?.label ?? "All Categories";
  const isPnlSort = selectedSort === "pnl";

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-4">
        <h1 className="text-3xl font-bold text-primary md:text-4xl">Leaderboard</h1>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="hidden items-center rounded-lg border border-border bg-card p-1 md:inline-flex">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  selectedTime === option.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSelectedTime(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 justify-between border-border bg-card text-foreground"
                >
                  {selectedTimeLabel}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 border-border bg-card">
                {TIME_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.key} onClick={() => setSelectedTime(option.key)}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 justify-between border-border bg-card text-foreground"
                >
                  {selectedCategoryLabel}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-border bg-card">
                {CATEGORY_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.value} onClick={() => setSelectedCategory(option.value)}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="hidden h-10 min-w-[184px] justify-between border-border bg-card text-foreground md:inline-flex"
              >
                {selectedCategoryLabel}
                <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border bg-card">
              {CATEGORY_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setSelectedCategory(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-2 py-2 md:justify-between md:px-6 md:py-3">
            <div className="relative min-w-0 flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 border-0 bg-transparent pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 justify-between px-2 text-sm text-foreground hover:bg-transparent"
                  >
                    {selectedSortLabel}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.key} onClick={() => setSelectedSort(option.key)}>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="space-y-3 p-4 md:p-6">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-12 animate-pulse rounded-md bg-secondary/40 md:h-14"
                  />
                ))}
              </div>
            ) : filteredEntries.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground md:px-6">
                No leaderboard entries found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Trader</TableHead>
                    <TableHead
                      className={cn(
                        "text-right",
                        !isPnlSort ? "hidden md:table-cell" : "table-cell"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSort("pnl")}
                        className={cn(
                          "inline-flex items-center justify-end gap-1 font-medium transition-colors hover:text-foreground",
                          selectedSort === "pnl" ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        Profit/Loss
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                    <TableHead
                      className={cn(
                        "text-right",
                        isPnlSort ? "hidden md:table-cell" : "table-cell"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSort("volume")}
                        className={cn(
                          "inline-flex items-center justify-end gap-1 font-medium transition-colors hover:text-foreground",
                          selectedSort === "volume" ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        Volume
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.entryKey}>
                      <TableCell className="text-muted-foreground text-center md:text-left">{entry.rank}</TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative">
                            <div
                              className={cn(
                                "h-9 w-9 rounded-full bg-gradient-to-br",
                                getAvatarGradient(entry.userId)
                              )}
                            />
                            {entry.rank <= 3 && (
                              <span className="absolute -bottom-1 -left-1 rounded-full bg-background p-0.5 text-amber-400">
                                <Trophy className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                          <span className="truncate font-semibold text-foreground text-xs md:hidden">
                            {truncateUsernameForMobile(entry.username)}
                          </span>
                          <span className="hidden truncate font-semibold text-foreground text-sm md:inline">
                            {entry.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-muted-foreground text-xs md:text-sm",
                          isPnlSort && "font-semibold text-foreground",
                          !isPnlSort ? "hidden md:table-cell" : "table-cell",
                          entry.profitLoss < 0 ? "text-red-500" : "text-green-500"
                        )}
                      >
                        {formatAmount(entry.profitLoss)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-muted-foreground text-xs md:text-sm",
                          !isPnlSort && "font-semibold text-foreground",
                          isPnlSort ? "hidden md:table-cell" : "table-cell"
                        )}
                      >
                        π{Math.round(entry.volume).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

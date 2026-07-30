"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  AlertTriangle,
  MessageSquareWarning,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { apiFetchWithToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn, formatPiAmount, roundLocale } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TrustSafetyData = {
  generated_at?: string;
  thresholds?: { high_comment_count_7d?: number; large_trade_pi_7d?: number };
  suspicious_signals?: {
    payment_amount_mismatches?: number;
    failed_payments_last_7d?: number;
    markets_with_blocked_comments?: number;
    duplicate_pi_username_groups?: number;
    scope_note?: string;
  };
  disputed_markets?: { scope_note?: string; count?: number; items?: DisputedMarketRow[] };
  markets_high_comment_activity?: {
    scope_note?: string;
    count?: number;
    items?: HighCommentRow[];
  };
  duplicate_pi_usernames?: {
    scope_note?: string;
    count?: number;
    items?: DuplicateUserRow[];
  };
  large_sudden_trades?: { scope_note?: string; count?: number; items?: LargeTradeRow[] };
  unresolved_edge_cases?: { scope_note?: string; count?: number; items?: EdgeCaseRow[] };
  manual_admin_overrides?: {
    scope_note?: string;
    count?: number;
    items?: ManualResolutionRow[];
  };
};

type DisputedMarketRow = { market_id: number; question: string; blocked_comments: number };
type HighCommentRow = { market_id: number; question: string; active_comments_7d: number };
type DuplicateUserRow = { pi_username: string; user_count: number; user_ids: number[] };
type LargeTradeRow = {
  trade_id: number;
  created_at: string;
  market_id: number;
  market_question: string;
  taker_user_id: number;
  pi_total_amount: number;
  side: string;
  outcome: string;
};
type EdgeCaseRow = { id: number; question: string; status: string; edge_cases: string; updated_at?: string };
type ManualResolutionRow = {
  id: number;
  question: string;
  resolved_outcome?: string | null;
  resolved_at?: string | null;
  resolved_by_username?: string | null;
  resolved_by_user_id?: string | null;
};

function fmtShort(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, "Pp");
}

function truncate(text: string, max: number) {
  const t = (text ?? "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Max viewport height per audit table block (matches /admin/users simplicity + scroll). */
const AUDIT_TABLE_MAX_H = "max-h-[22rem]";

function suspiciousElevatedBadgeClass(n: number) {
  if (n === 0) return "border-green-500 bg-green-500 text-white hover:bg-green-500/90";
  if (n >= 4) return "border-red-500 bg-red-500 text-white hover:bg-red-500/90";
  return "border-orange-500 bg-orange-500 text-white hover:bg-orange-500/90";
}

const statusOutlineClass =
  "inline-flex rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary";

function ScopeNote({ children }: { children: ReactNode }) {
  if (children == null || children === "") return null;
  return <p className="text-[11px] text-muted-foreground">{children}</p>;
}

function SectionRowCountBadge({ loading, n }: { loading: boolean; n: number }) {
  return (
    <Badge variant="outline" className="shrink-0 tabular-nums text-xs font-normal">
      {loading ? "..." : `${n} rows`}
    </Badge>
  );
}

/** Scrollable bordered viewport for audit tables (/admin/users — plain bordered region + overflow). */
function AuditTableViewport({
  loading,
  count,
  children,
}: {
  loading: boolean;
  count: number | undefined;
  children: ReactNode;
}) {
  const viewport = cn(AUDIT_TABLE_MAX_H, "overflow-auto rounded-lg border");
  if (loading) {
    return (
      <div className={cn(viewport, "flex items-center justify-center py-14 text-xs text-muted-foreground")}>
        <span
          className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden
        />
        Loading audit rows…
      </div>
    );
  }
  if (count === undefined) {
    return (
      <p className="rounded-lg border py-10 text-center text-xs text-muted-foreground">No data loaded yet. Try refresh.</p>
    );
  }
  if (count === 0) {
    return (
      <p className="rounded-lg border bg-muted/10 py-10 text-center text-xs text-muted-foreground">
        No rows in this slice — workspace clear.
      </p>
    );
  }
  return <div className={viewport}>{children}</div>;
}

export function TrustSafetyManager() {
  const { toast } = useToast();
  const [data, setData] = useState<TrustSafetyData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetchWithToken<{ ok?: boolean; data?: TrustSafetyData }>(
        "/admin/trust-safety",
        { method: "GET" },
      );
      setData(res?.data ?? null);
    } catch (e: unknown) {
      setData(null);
      const msg = e instanceof Error ? e.message : "Failed to load trust / safety dashboard.";
      toast({ title: "Trust / Safety load failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const sig = data?.suspicious_signals;
  const th = data?.thresholds;

  const snapshotParts = [
    data?.generated_at ? `Updated ${fmtShort(data.generated_at)}` : null,
    th?.high_comment_count_7d != null ? `High-comment ≥ ${th.high_comment_count_7d}/7d` : null,
    th?.large_trade_pi_7d != null ? `Large trade ≥ ${formatPiAmount(th.large_trade_pi_7d)}/7d` : null,
  ].filter(Boolean);

  const disputedCount = data?.disputed_markets?.items?.length ?? 0;
  const highCommentCount = data?.markets_high_comment_activity?.items?.length ?? 0;
  const duplicateCount = data?.duplicate_pi_usernames?.items?.length ?? 0;
  const largeTradeCount = data?.large_sudden_trades?.items?.length ?? 0;
  const edgeCaseCount = data?.unresolved_edge_cases?.items?.length ?? 0;
  const manualOverrideCount = data?.manual_admin_overrides?.items?.length ?? 0;

  const suspiciousElevated =
    loading || !sig
      ? undefined
      : [
          Number(sig.payment_amount_mismatches ?? 0),
          Number(sig.failed_payments_last_7d ?? 0),
          Number(sig.markets_with_blocked_comments ?? 0),
          Number(sig.duplicate_pi_username_groups ?? 0),
        ].filter((n) => n > 0).length;

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Trust / Safety</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-2 text-xs"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh snapshot
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Signals from ledger, comments, and market metadata. Treat every flag as provisional until reviewed.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">{snapshotParts.join(" · ") || "—"}</p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Suspicious activity</h2>
            {!loading && suspiciousElevated !== undefined ? (
              <Badge className={cn("shrink-0 tabular-nums", suspiciousElevatedBadgeClass(suspiciousElevated))}>
                {suspiciousElevated} / 4 elevated
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Summary metrics; detailed lists below scroll inside a capped height like user admin tables.
          </p>
        </div>
        {sig?.scope_note ? <p className="text-[11px] text-muted-foreground">{sig.scope_note}</p> : null}
        <div className={cn(AUDIT_TABLE_MAX_H, "overflow-y-auto rounded-lg border p-2")}>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Payment ↔ order mismatches</p>
              <Wallet className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-md font-semibold">{loading ? "..." : roundLocale(sig?.payment_amount_mismatches ?? 0)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Failed payments (7d)</p>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="mt-2 text-md font-semibold">{loading ? "..." : roundLocale(sig?.failed_payments_last_7d ?? 0)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Markets w/ blocked comments</p>
              <MessageSquareWarning className="h-4 w-4 text-orange-500" />
            </div>
            <p className="mt-2 text-md font-semibold">
              {loading ? "..." : roundLocale(sig?.markets_with_blocked_comments ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Duplicate Pi username groups</p>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-md font-semibold">
              {loading ? "..." : roundLocale(sig?.duplicate_pi_username_groups ?? 0)}
            </p>
          </div>
        </div>
        </div>
        {!loading && suspiciousElevated === 0 ? (
          <p className="text-xs text-muted-foreground">
            All four roll-up metrics are zero — nothing elevated in this slice.
          </p>
        ) : null}
      </section>

      {/* Disputed markets */}
      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Disputed markets</h2>
            <SectionRowCountBadge loading={loading} n={disputedCount} />
          </div>
          <p className="text-xs text-muted-foreground">Markets with blocked comments surfaced for dispute review.</p>
        </div>
        <ScopeNote>{data?.disputed_markets?.scope_note}</ScopeNote>
        <AuditTableViewport loading={loading} count={data?.disputed_markets?.items?.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="truncate text-xs">Market</TableHead>
                <TableHead className="text-xs">Question</TableHead>
                <TableHead className="w-[10rem] truncate text-right text-xs">Blocked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.disputed_markets?.items ?? []).map((r) => (
                <TableRow key={r.market_id}>
                  <TableCell className="text-xs">
                    <Link
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                      href={`/admin/markets/${r.market_id}`}
                    >
                      #{r.market_id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-xs">{truncate(r.question, 140)}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{roundLocale(r.blocked_comments)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AuditTableViewport>
      </section>

      {/* High comment activity */}
      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Markets with high comment activity</h2>
            <SectionRowCountBadge loading={loading} n={highCommentCount} />
          </div>
          <p className="text-xs text-muted-foreground">Heavy comment velocity over the trailing 7-day window.</p>
        </div>
        <ScopeNote>{data?.markets_high_comment_activity?.scope_note}</ScopeNote>
        <AuditTableViewport loading={loading} count={data?.markets_high_comment_activity?.items?.length}>
          <>
            <div className="hidden md:block [&_table]:w-full [&_table]:table-fixed">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[5rem] truncate text-xs">Market</TableHead>
                    <TableHead className="text-xs">Question</TableHead>
                    <TableHead className="w-[7rem] truncate text-right text-xs">Comments (7d)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.markets_high_comment_activity?.items ?? []).map((r) => (
                    <TableRow key={r.market_id}>
                      <TableCell className="text-xs align-top">
                        <Link
                          className="font-semibold text-primary underline-offset-4 hover:underline"
                          href={`/admin/markets/${r.market_id}`}
                        >
                          #{r.market_id}
                        </Link>
                      </TableCell>
                      <TableCell className="break-words text-xs">{truncate(r.question, 140)}</TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">{r.active_comments_7d}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden min-w-0 overflow-x-hidden">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b bg-muted/30 px-4 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Market</span>
                <span className="text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Comments (7d)
                </span>
              </div>
              <ul className="divide-y divide-border">
                {(data?.markets_high_comment_activity?.items ?? []).map((r) => (
                  <li key={r.market_id} className="px-4 py-2 first:pt-3.5 last:pb-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        className="min-w-0 truncate text-xs font-semibold text-primary underline-offset-4 hover:underline"
                        href={`/admin/markets/${r.market_id}`}
                      >
                        #{r.market_id}
                      </Link>
                      <span
                        className="shrink-0 rounded-md bg-muted/70 px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground shadow-sm ring-1 ring-border/60 dark:bg-muted/40 dark:ring-white/10"
                        aria-label={`${r.active_comments_7d} active comments in the last 7 days`}
                        title="Active comments over the trailing 7 days"
                      >
                        {r.active_comments_7d}
                      </span>
                    </div>
                    <p className="mt-1 border-t border-dashed border-border/60 pt-1 text-xs leading-relaxed text-foreground break-words">
                      {r.question}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        </AuditTableViewport>
      </section>

      {/* Duplicate Pi usernames */}
      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Duplicate Pi usernames</h2>
            <SectionRowCountBadge loading={loading} n={duplicateCount} />
          </div>
          <p className="text-xs text-muted-foreground">Multiple accounts claiming the same Pi Network username reference.</p>
        </div>
        <ScopeNote>{data?.duplicate_pi_usernames?.scope_note}</ScopeNote>
        <AuditTableViewport loading={loading} count={data?.duplicate_pi_usernames?.items?.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="truncate text-xs">Pi username</TableHead>
                <TableHead className="truncate text-right text-xs">Users</TableHead>
                <TableHead className="truncate text-xs">User IDs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.duplicate_pi_usernames?.items ?? []).map((r, idx) => (
                <TableRow key={`${r.pi_username}-${idx}`}>
                  <TableCell className="text-xs font-medium">{r.pi_username}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{r.user_count}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{r.user_ids.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AuditTableViewport>
      </section>

      {/* Large sudden trades */}
      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Large sudden trades</h2>
            <SectionRowCountBadge loading={loading} n={largeTradeCount} />
          </div>
          <p className="text-xs text-muted-foreground">Individual fills above the rolling large-trade threshold.</p>
        </div>
        <ScopeNote>{data?.large_sudden_trades?.scope_note}</ScopeNote>
        <AuditTableViewport loading={loading} count={data?.large_sudden_trades?.items?.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="truncate text-xs whitespace-nowrap">Time</TableHead>
                <TableHead className="truncate text-xs">Market</TableHead>
                <TableHead className="text-xs">Question</TableHead>
                <TableHead className="truncate text-xs whitespace-nowrap">Taker</TableHead>
                <TableHead className="truncate text-right text-xs whitespace-nowrap">π total</TableHead>
                <TableHead className="truncate text-xs">Side</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.large_sudden_trades?.items ?? []).map((r) => (
                <TableRow key={`${r.trade_id}-${r.created_at}`}>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{fmtShort(r.created_at)}</TableCell>
                  <TableCell className="text-xs">
                    <Link
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                      href={`/admin/markets/${r.market_id}`}
                    >
                      #{r.market_id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs">{truncate(r.market_question, 96)}</TableCell>
                  <TableCell className="font-mono text-[11px]">{r.taker_user_id}</TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums">{formatPiAmount(r.pi_total_amount)}</TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium">
                      {r.side} · {r.outcome}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AuditTableViewport>
      </section>

      {/* Unresolved edge cases */}
      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Unresolved edge cases</h2>
            <SectionRowCountBadge loading={loading} n={edgeCaseCount} />
          </div>
          <p className="text-xs text-muted-foreground">Market records still carrying unresolved edge metadata.</p>
        </div>
        <ScopeNote>{data?.unresolved_edge_cases?.scope_note}</ScopeNote>
        <AuditTableViewport loading={loading} count={data?.unresolved_edge_cases?.items?.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="truncate text-xs">Market</TableHead>
                <TableHead className="text-xs">Question</TableHead>
                <TableHead className="truncate text-xs whitespace-nowrap">Status</TableHead>
                <TableHead className="truncate text-xs">Edge cases</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.unresolved_edge_cases?.items ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    <Link
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                      href={`/admin/markets/${r.id}`}
                    >
                      #{r.id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs">{truncate(r.question, 100)}</TableCell>
                  <TableCell className="text-xs">
                    <span className={statusOutlineClass}>{r.status}</span>
                  </TableCell>
                  <TableCell className="max-w-lg whitespace-pre-wrap text-[11px] text-muted-foreground">
                    {truncate(r.edge_cases ?? "", 320)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AuditTableViewport>
      </section>

      {/* Manual admin overrides */}
      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Manual admin overrides</h2>
            <SectionRowCountBadge loading={loading} n={manualOverrideCount} />
          </div>
          <p className="text-xs text-muted-foreground">Markets resolved by an admin outside the automated flow.</p>
        </div>
        <ScopeNote>{data?.manual_admin_overrides?.scope_note}</ScopeNote>
        <AuditTableViewport loading={loading} count={data?.manual_admin_overrides?.items?.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="truncate text-xs">Market</TableHead>
                <TableHead className="text-xs">Question</TableHead>
                <TableHead className="truncate text-xs whitespace-nowrap">Outcome</TableHead>
                <TableHead className="truncate text-xs whitespace-nowrap">Resolved</TableHead>
                <TableHead className="truncate text-xs">By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.manual_admin_overrides?.items ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    <Link
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                      href={`/admin/markets/${r.id}`}
                    >
                      #{r.id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-xs">{truncate(r.question ?? "", 120)}</TableCell>
                  <TableCell className="text-xs font-medium">{r.resolved_outcome ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    {r.resolved_at ? format(new Date(r.resolved_at), "P") : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{r.resolved_by_username ?? r.resolved_by_user_id ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AuditTableViewport>
      </section>
    </section>
  );
}

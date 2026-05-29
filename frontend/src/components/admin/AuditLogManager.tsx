"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ClipboardList, History, ShieldAlert } from "lucide-react";
import { apiFetchWithToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditRow = {
  id: number;
  user_id: string | null;
  ip: string;
  category_key: string | null;
  action_type: string;
  result: string;
  reason: string | null;
  timestamp: string;
};

const EVENT_TYPES = [
  "market_created",
  "market_edited",
  "market_closed",
  "market_resolved",
  "payout_marked_paid",
  "user_banned",
  "user_suspended",
  "user_status_changed",
  "comment_removed",
  "clarification_posted",
  "rules_changed",
  "manual_override",
] as const;

function formatActionLabel(action: string): string {
  return action.replace(/_/g, " ");
}

function actionBadgeClass(action: string): string {
  if (action === "manual_override") return "border-amber-600 text-amber-800";
  if (action.includes("banned") || action === "comment_removed") {
    return "border-red-500 text-red-700";
  }
  if (action.includes("resolved") || action === "payout_marked_paid") {
    return "border-emerald-600 text-emerald-800";
  }
  return "";
}

function subjectFromRow(row: AuditRow): string {
  const key = row.category_key?.trim();
  if (!key) return "—";
  if (key.startsWith("market:")) return `Market ${key.slice(7)}`;
  if (key.startsWith("user:")) return `User ${key.slice(5)}`;
  if (key.startsWith("position:")) return `Position ${key.slice(9)}`;
  if (key.startsWith("comment:")) return `Comment ${key.slice(8)}`;
  return key;
}

export function AuditLogManager() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"all" | "manual">("all");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState<string>("ALL");
  const [marketId, setMarketId] = useState("");
  const [adminUserId, setAdminUserId] = useState("");

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (tab === "manual") params.set("manual_override_only", "true");
    if (eventType !== "ALL") params.set("event_type", eventType);
    if (marketId.trim()) params.set("market_id", marketId.trim());
    if (adminUserId.trim()) params.set("user_id", adminUserId.trim());
    return params.toString();
  }, [limit, offset, tab, eventType, marketId, adminUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetchWithToken<{
        ok?: boolean;
        data?: AuditRow[];
        total?: number;
      }>(`/admin/audit-log?${qs}`, { method: "GET" });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(Number(res.total ?? 0));
    } catch (e: unknown) {
      setRows([]);
      setTotal(0);
      const message = e instanceof Error ? e.message : "Failed to load audit log";
      toast({ title: "Audit log load failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [qs, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold leading-none tracking-tight">Audit Log</h2>
        <p className="text-xs text-muted-foreground">
          Immutable record of admin actions: markets, payouts, moderation, and manual overrides.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "all" | "manual");
          setOffset(0);
        }}
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            All actions
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-1.5 text-xs">
            <ShieldAlert className="h-3.5 w-3.5" />
            Manual overrides
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={eventType}
              onValueChange={(v) => {
                setOffset(0);
                setEventType(v);
              }}
              disabled={tab === "manual"}
            >
              <SelectTrigger className="min-w-40 text-xs">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All event types</SelectItem>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatActionLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Market ID"
              value={marketId}
              onChange={(e) => {
                setOffset(0);
                setMarketId(e.target.value);
              }}
              className="w-28 text-xs"
            />
            <Input
              placeholder="Admin user ID"
              value={adminUserId}
              onChange={(e) => {
                setOffset(0);
                setAdminUserId(e.target.value);
              }}
              className="w-36 text-xs"
            />
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => void load()}>
              Refresh
            </Button>
            <p className="ml-auto text-[11px] text-muted-foreground tabular-nums">
              {loading ? "…" : `${rows.length} shown · ${total} total`}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Timestamp</TableHead>
                <TableHead className="text-xs">Admin</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs">Subject</TableHead>
                <TableHead className="text-xs">Detail</TableHead>
                <TableHead className="text-xs">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-xs text-muted-foreground">
                    {loading ? "Loading…" : "No audit entries match these filters."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {format(new Date(r.timestamp), "Pp")}
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">{r.user_id ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className={actionBadgeClass(r.action_type)}>
                        {formatActionLabel(r.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{subjectFromRow(r)}</TableCell>
                    <TableCell className="max-w-md text-xs text-muted-foreground">
                      {r.reason ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{r.ip}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {total > limit ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                disabled={offset + limit >= total || loading}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ClipboardList className="h-3.5 w-3.5" />
        New admin actions are logged automatically. Older actions before this release may not appear.
      </p>
    </section>
  );
}

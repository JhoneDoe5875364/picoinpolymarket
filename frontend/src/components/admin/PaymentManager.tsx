
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Clock,
  Wallet,
  WalletCards,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { apiFetchWithToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { roundLocale } from "@/lib/utils";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaymentOverview = {
  user_to_app_payments_received: { count: number; total_pi: number };
  app_to_user_payouts_sent: {
    count: number;
    total_pi: number;
    tracking_note?: string;
  };
  pending_payouts: {
    count: number;
    total_pi: number;
    scope_note?: string;
  };
  failed_payouts: {
    count: number;
    total_pi: number;
    scope_note?: string;
  };
  manual_payout_queue: {
    count: number;
    total_pi: number;
    scope_note?: string;
  };
  wallet_address_connected_users: number;
  wallet_address_missing_users: number;
  wallet_scope_note?: string;
  payment_mismatch_warnings: {
    count: number;
    scope_note?: string;
  };
};

type AdminPaymentRow = {
  id: number;
  user_id: number;
  pi_username: string | null;
  order_id: number;
  amount: number;
  order_pi_amount: number;
  status: string;
  pi_payment_id: string | null;
  txid: string | null;
  created_at: string;
  amount_mismatch: boolean;
};

const emptyOverview = (): PaymentOverview => ({
  user_to_app_payments_received: { count: 0, total_pi: 0 },
  app_to_user_payouts_sent: { count: 0, total_pi: 0 },
  pending_payouts: { count: 0, total_pi: 0 },
  failed_payouts: { count: 0, total_pi: 0 },
  manual_payout_queue: { count: 0, total_pi: 0 },
  wallet_address_connected_users: 0,
  wallet_address_missing_users: 0,
  payment_mismatch_warnings: { count: 0 },
});

export function PaymentManager() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<PaymentOverview>(emptyOverview);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "CANCELLED"
  >("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    params.set("status", statusFilter);
    return params.toString();
  }, [offset, limit, statusFilter]);

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const res = await apiFetchWithToken(`/admin/payments/overview`, { method: "GET" });
      if (res.ok && res.data) {
        const d = res.data as PaymentOverview;
        setOverview({
          user_to_app_payments_received: {
            count: Number(d.user_to_app_payments_received?.count ?? 0),
            total_pi: Number(d.user_to_app_payments_received?.total_pi ?? 0),
          },
          app_to_user_payouts_sent: {
            count: Number(d.app_to_user_payouts_sent?.count ?? 0),
            total_pi: Number(d.app_to_user_payouts_sent?.total_pi ?? 0),
            tracking_note: d.app_to_user_payouts_sent?.tracking_note,
          },
          pending_payouts: {
            count: Number(d.pending_payouts?.count ?? 0),
            total_pi: Number(d.pending_payouts?.total_pi ?? 0),
            scope_note: d.pending_payouts?.scope_note,
          },
          failed_payouts: {
            count: Number(d.failed_payouts?.count ?? 0),
            total_pi: Number(d.failed_payouts?.total_pi ?? 0),
            scope_note: d.failed_payouts?.scope_note,
          },
          manual_payout_queue: {
            count: Number(d.manual_payout_queue?.count ?? 0),
            total_pi: Number(d.manual_payout_queue?.total_pi ?? 0),
            scope_note: d.manual_payout_queue?.scope_note,
          },
          wallet_address_connected_users: Number(d.wallet_address_connected_users ?? 0),
          wallet_address_missing_users: Number(d.wallet_address_missing_users ?? 0),
          wallet_scope_note: d.wallet_scope_note,
          payment_mismatch_warnings: {
            count: Number(d.payment_mismatch_warnings?.count ?? 0),
            scope_note: d.payment_mismatch_warnings?.scope_note,
          },
        });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Overview load failed", description: message, variant: "destructive" });
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadPayments() {
    setLoading(true);
    try {
      const res = await apiFetchWithToken(`/admin/payments?${qs}`, { method: "GET" });
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(
        list.map((r: AdminPaymentRow) => ({
          ...r,
          amount: Number(r.amount ?? 0),
          order_pi_amount: Number(r.order_pi_amount ?? 0),
          amount_mismatch: Boolean(r.amount_mismatch),
        }))
      );
      setTotal(Number(res.total ?? 0));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Payments load failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [qs]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = (r.pi_username ?? "").toLowerCase();
      const idStr = String(r.user_id);
      const orderStr = String(r.order_id);
      return (
        name.includes(q) ||
        idStr.includes(q) ||
        orderStr.includes(q) ||
        (r.pi_payment_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "border-green-600 bg-green-600 text-white hover:bg-green-600/90";
      case "PENDING":
        return "border-orange-500 bg-orange-500 text-white hover:bg-orange-500/90";
      case "APPROVED":
        return "border-blue-500 bg-blue-500 text-white hover:bg-blue-500/90";
      case "FAILED":
        return "border-red-500 bg-red-500 text-white hover:bg-red-500/90";
      case "CANCELLED":
        return "border-muted-foreground bg-muted text-foreground hover:bg-muted/90";
      default:
        return "";
    }
  };

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold leading-none tracking-tight">Payment & Wallet</h2>
        <p className="text-xs text-muted-foreground">
          Monitor Pi payments, queues, wallet visibility on leaderboards, and amount consistency with orders.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">User-to-App payments received</p>
            <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.user_to_app_payments_received.count)} · ${roundLocale(overview.user_to_app_payments_received.total_pi)} π`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Completed Pi payments (count · total)</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">App-to-User payouts sent</p>
            <ArrowUpFromLine className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.app_to_user_payouts_sent.count)} · ${roundLocale(overview.app_to_user_payouts_sent.total_pi)} π`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.app_to_user_payouts_sent.tracking_note ??
              "Not tracked in DB until payout ledger exists."}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pending payouts</p>
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.pending_payouts.count)} · ${roundLocale(overview.pending_payouts.total_pi)} π`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.pending_payouts.scope_note ?? "Pi payment records in PENDING status."}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Failed payouts</p>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.failed_payouts.count)} · ${roundLocale(overview.failed_payouts.total_pi)} π`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.failed_payouts.scope_note ?? "FAILED payment records."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Manual payout queue</p>
            <ClipboardList className="h-4 w-4 text-violet-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.manual_payout_queue.count)} · ${roundLocale(overview.manual_payout_queue.total_pi)} π`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.manual_payout_queue.scope_note ?? "APPROVED payments awaiting completion."}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Wallet address connected</p>
            <WalletCards className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading ? "..." : roundLocale(overview.wallet_address_connected_users)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.wallet_scope_note ?? "Distinct users with wallet on leaderboard rows."}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Wallet address missing</p>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading ? "..." : roundLocale(overview.wallet_address_missing_users)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Members with no leaderboard wallet row</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Payment mismatch warnings</p>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading ? "..." : roundLocale(overview.payment_mismatch_warnings.count)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.payment_mismatch_warnings.scope_note ??
              "payments.amount vs orders.pi_amount"}
          </p>
        </div>
      </div>

      <div>
        <div className="flex gap-2 flex-row items-center">
          <div className="w-full min-w-0 flex-[2]">
            <Input
              placeholder="Filter loaded page by user / order / Pi payment id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs"
            />
          </div>
          <div className="flex w-full min-w-0 flex-[1] flex-wrap items-center gap-2 md:justify-end">
            <Select
              value={statusFilter}
              onValueChange={(value: typeof statusFilter) => {
                setOffset(0);
                setStatusFilter(value);
              }}
            >
              <SelectTrigger className="min-w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-right mt-2">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {loading ? "…" : `${roundLocale(filteredRows.length)} shown · ${roundLocale(total)} total`}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Order</TableHead>
              <TableHead className="text-xs">Amounts</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Pi payment</TableHead>
              <TableHead className="text-xs">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : "No payment rows for this filter."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">
                    {r.pi_username ?? `User ${r.user_id}`}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.order_id}</TableCell>
                  <TableCell className="text-xs">
                    <span className="tabular-nums">{roundLocale(r.amount)} π</span>
                    <span className="text-muted-foreground"> / order </span>
                    <span className="tabular-nums">{roundLocale(r.order_pi_amount)} π</span>
                    {r.amount_mismatch ? (
                      <Badge variant="outline" className="ml-2 border-amber-600 text-[10px] text-amber-700">
                        Mismatch
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge className={statusBadgeClass(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate font-mono text-[11px] text-muted-foreground">
                    {r.pi_payment_id ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">{format(new Date(r.created_at), "Pp")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {total > limit ? (
          <div className="mt-2 flex items-center justify-end gap-2">
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
      </div>
    </section>
  );
}


"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ClipboardList,
  Clock,
  Copy,
  Loader2,
  MoreHorizontal,
  Wallet,
  WalletCards,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { apiFetchWithToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatPiAmount, roundLocale } from "@/lib/utils";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataPagination } from "@/components/ui/data-pagination";

type PaymentOverview = {
  user_to_app_payments_received: { count: number; total_pi: number };
  app_to_user_payouts_sent: {
    count: number;
    total_pi: number;
    tracking_note?: string;
    scope_note?: string;
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
  app_wallet?: {
    balance: number | null;
    address: string | null;
  } | null;
};

type AdminPaymentRow = {
  id: number;
  user_id: number;
  pi_username: string | null;
  order_id: number;
  market_id: number | null;
  market_question: string | null;
  outcome: string | null;
  shares: number;
  amount: number;
  order_pi_amount: number;
  status: string;
  pi_payment_id: string | null;
  txid: string | null;
  created_at: string;
  amount_mismatch: boolean;
};

type PayoutQueueRow = {
  position_id: number;
  user_id: number;
  pi_username: string | null;
  market_id: number;
  market_question: string;
  outcome: string;
  amount_owed: number;
  wallet_address: string | null;
  payment_status: string;
  txid: string | null;
  resolved_at: string | null;
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
  app_wallet: null,
});

/** Truncated address with a one-click copy button — the full value never fits. */
function CopyableAddress({ value }: { value: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; nothing to do */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={value}
      className="group inline-flex max-w-[160px] items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  );
}

/** Market name truncated in the cell, full text on hover (question can be long). */
function MarketCell({ question }: { question: string | null }) {
  if (!question) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block max-w-[200px] truncate text-xs">{question}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {question}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PaymentManager() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<PaymentOverview>(emptyOverview);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "CANCELLED"
  >("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [payoutRows, setPayoutRows] = useState<PayoutQueueRow[]>([]);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [payoutOffset, setPayoutOffset] = useState(0);
  const [payoutLimit, setPayoutLimit] = useState(20);
  const [payoutStatus, setPayoutStatus] = useState<"pending" | "paid" | "ALL">("pending");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutActionId, setPayoutActionId] = useState<number | null>(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    params.set("status", statusFilter);
    return params.toString();
  }, [offset, limit, statusFilter]);

  const payoutQs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(payoutLimit));
    params.set("offset", String(payoutOffset));
    params.set("status", payoutStatus);
    return params.toString();
  }, [payoutOffset, payoutLimit, payoutStatus]);

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
          app_wallet: d.app_wallet
            ? {
                balance:
                  d.app_wallet.balance === null || d.app_wallet.balance === undefined
                    ? null
                    : Number(d.app_wallet.balance),
                address: d.app_wallet.address ?? null,
              }
            : null,
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
          outcome: r.outcome ?? null,
          shares: Number(r.shares ?? 0),
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

  async function loadPayoutQueue() {
    setPayoutLoading(true);
    try {
      const res = await apiFetchWithToken(`/admin/payout-queue?${payoutQs}`, { method: "GET" });
      const list = Array.isArray(res.data) ? res.data : [];
      setPayoutRows(
        list.map((r: PayoutQueueRow) => ({
          ...r,
          amount_owed: Number(r.amount_owed ?? 0),
        }))
      );
      setPayoutTotal(Number(res.total ?? 0));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Payout queue load failed", description: message, variant: "destructive" });
    } finally {
      setPayoutLoading(false);
    }
  }

  async function markPayoutPaid(positionId: number) {
    // A manual mark-paid records NO on-chain txid, so a mistaken click makes the
    // winner un-payable. Require a note documenting how they were actually paid.
    const note =
      typeof window !== "undefined"
        ? window.prompt(
            "This only MARKS the payout as paid — it does NOT send Pi.\n" +
              "Use it only if you paid the winner another way.\n\n" +
              "Note (how/where you paid them):",
            ""
          )
        : null;
    if (note === null) return;
    if (!note.trim()) {
      toast({ title: "Note required", description: "Describe how the winner was paid.", variant: "destructive" });
      return;
    }
    setPayoutActionId(positionId);
    try {
      const res = await apiFetchWithToken(`/admin/payout-queue/${positionId}/mark-paid`, {
        method: "POST",
        body: JSON.stringify({ note: note.trim() }),
      });
      if (res.ok) {
        toast({ title: "Payout marked paid", description: `Position #${positionId}` });
        await loadPayoutQueue();
        await loadOverview();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Mark paid failed", description: message, variant: "destructive" });
    } finally {
      setPayoutActionId(null);
    }
  }

  async function unclaimPayout(positionId: number) {
    const reason =
      typeof window !== "undefined"
        ? window.prompt(
            "Return this payout to the queue (reverse a mistaken mark-paid)?\n" +
              "Real on-chain payouts (with a txid) cannot be reversed.\n\n" +
              "Reason:",
            "Reversed mistaken mark-paid"
          )
        : null;
    if (reason === null) return;
    setPayoutActionId(positionId);
    try {
      const res = await apiFetchWithToken(`/admin/payout-queue/${positionId}/unclaim`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      });
      if (res.ok) {
        toast({ title: "Payout returned to queue", description: `Position #${positionId}` });
        await loadPayoutQueue();
        await loadOverview();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Reverse failed", description: message, variant: "destructive" });
    } finally {
      setPayoutActionId(null);
    }
  }

  async function autoPayPayout(positionId: number) {
    if (
      !window.confirm(
        `Send this payout automatically from the app wallet?\n\nThis moves real Pi on-chain and cannot be undone.`
      )
    ) {
      return;
    }
    setPayoutActionId(positionId);
    try {
      const res = await apiFetchWithToken<{ ok?: boolean; data?: { payout_txid?: string } }>(
        `/admin/payout-queue/${positionId}/auto-pay`,
        { method: "POST" }
      );
      if (res.ok) {
        toast({
          title: "Payout sent",
          description: `Position #${positionId} · txid ${res.data?.payout_txid ?? ""}`,
        });
        await loadPayoutQueue();
        await loadOverview();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Auto-pay failed", description: message, variant: "destructive" });
    } finally {
      setPayoutActionId(null);
    }
  }

  async function flagPayoutReview(positionId: number) {
    const reason =
      typeof window !== "undefined"
        ? window.prompt("Reason for review (optional):", "Needs manual verification")
        : null;
    if (reason === null) return;
    setPayoutActionId(positionId);
    try {
      const res = await apiFetchWithToken(`/admin/payout-queue/${positionId}/flag`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      });
      if (res.ok) {
        toast({ title: "Flagged for review", description: `Position #${positionId}` });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Flag failed", description: message, variant: "destructive" });
    } finally {
      setPayoutActionId(null);
    }
  }

  function exportPayoutRow(row: PayoutQueueRow) {
    const line = [
      row.position_id,
      row.user_id,
      row.pi_username ?? "",
      row.market_id,
      `"${(row.market_question ?? "").replace(/"/g, '""')}"`,
      row.outcome,
      row.amount_owed,
      row.wallet_address ?? "",
      row.payment_status,
      row.txid ?? "",
      row.resolved_at ?? "",
    ].join(",");
    const blob = new Blob([line + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-${row.position_id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [qs]);

  useEffect(() => {
    void loadPayoutQueue();
  }, [payoutQs]);

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

      <div className="rounded-lg border bg-emerald-500/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">App wallet balance</p>
          <Wallet className="h-5 w-5 text-emerald-500" />
        </div>
        <p className="mt-2 text-2xl font-bold">
          {overviewLoading
            ? "..."
            : overview.app_wallet && overview.app_wallet.balance !== null
              ? formatPiAmount(overview.app_wallet.balance)
              : "—"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {overview.app_wallet
            ? "Funds every A2U payout. Top up before it runs low."
            : "Auto-pay disabled or balance unavailable."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Link href="/admin/payments/received" className="block rounded-lg border p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">User-to-App payments received</p>
            <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.user_to_app_payments_received.count)} · ${formatPiAmount(overview.user_to_app_payments_received.total_pi)}`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Completed Pi payments (count · total)</p>
        </Link>
        <Link href="/admin/payments/payouts-sent" className="block rounded-lg border p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">App-to-User payouts sent</p>
            <ArrowUpFromLine className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.app_to_user_payouts_sent.count)} · ${formatPiAmount(overview.app_to_user_payouts_sent.total_pi)}`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.app_to_user_payouts_sent.scope_note ??
              overview.app_to_user_payouts_sent.tracking_note ??
              "Winning payouts sent (on-chain or manual)."}
          </p>
        </Link>
        <Link href="/admin/payments/pending" className="block rounded-lg border p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pending payments</p>
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.pending_payouts.count)} · ${formatPiAmount(overview.pending_payouts.total_pi)}`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.pending_payouts.scope_note ?? "Buy payments in PENDING status."}
          </p>
        </Link>
        <Link href="/admin/payments/failed" className="block rounded-lg border p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Failed payments</p>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.failed_payouts.count)} · ${formatPiAmount(overview.failed_payouts.total_pi)}`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.failed_payouts.scope_note ?? "FAILED buy-payment records."}
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Link href="/admin/payments/payout-queue" className="block rounded-lg border p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Manual payout queue</p>
            <ClipboardList className="h-4 w-4 text-violet-500" />
          </div>
          <p className="mt-2 text-md font-semibold">
            {overviewLoading
              ? "..."
              : `${roundLocale(overview.manual_payout_queue.count)} · ${formatPiAmount(overview.manual_payout_queue.total_pi)}`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overview.manual_payout_queue.scope_note ?? "Winners awaiting payout."}
          </p>
        </Link>
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
          <p className="mt-1 text-[11px] text-muted-foreground">Users who have not saved a payout wallet address</p>
        </div>
        <Link href="/admin/payments/mismatch" className="block rounded-lg border p-3 transition-colors hover:bg-muted/40">
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
        </Link>
      </div>

      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Payout queue</h3>
            <p className="text-[11px] text-muted-foreground">
              Winning positions on resolved markets — send Pi manually, then mark paid.
            </p>
          </div>
          <Select
            value={payoutStatus}
            onValueChange={(v: typeof payoutStatus) => {
              setPayoutOffset(0);
              setPayoutStatus(v);
            }}
          >
            <SelectTrigger className="min-w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {payoutLoading ? "…" : `${payoutRows.length} shown · ${payoutTotal} total`}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Market</TableHead>
              <TableHead className="text-xs">Outcome</TableHead>
              <TableHead className="text-xs">Owed</TableHead>
              <TableHead className="text-xs">Wallet</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">TxID</TableHead>
              <TableHead className="text-xs w-16">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payoutRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-xs text-muted-foreground">
                  {payoutLoading ? "Loading…" : "No payout queue rows for this filter."}
                </TableCell>
              </TableRow>
            ) : (
              payoutRows.map((r) => (
                <TableRow
                  key={r.position_id}
                  className={payoutActionId === r.position_id ? "bg-sky-500/5" : undefined}
                >
                  <TableCell className="text-xs font-medium">
                    {r.pi_username ?? `User ${r.user_id}`}
                  </TableCell>
                  <TableCell>
                    <MarketCell question={r.market_question} />
                  </TableCell>
                  <TableCell className="text-xs">{r.outcome}</TableCell>
                  <TableCell className="tabular-nums text-xs">{formatPiAmount(r.amount_owed)}</TableCell>
                  <TableCell>
                    <CopyableAddress value={r.wallet_address} />
                  </TableCell>
                  <TableCell className="text-xs">
                    {payoutActionId === r.position_id ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-sky-600 dark:text-sky-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          r.payment_status === "paid"
                            ? "border-green-600 text-green-700"
                            : "border-orange-500 text-orange-700"
                        }
                      >
                        {r.payment_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <CopyableAddress value={r.txid} />
                  </TableCell>
                  <TableCell className="text-xs">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={payoutActionId === r.position_id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {r.payment_status !== "paid" ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => void autoPayPayout(r.position_id)}
                              className="font-medium text-primary"
                            >
                              Auto-pay (send Pi)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void markPayoutPaid(r.position_id)}>
                              Mark paid (manual)
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => void unclaimPayout(r.position_id)}
                            className="text-amber-600"
                          >
                            Return to queue (reverse)
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => void flagPayoutReview(r.position_id)}>
                          Flag for review
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportPayoutRow(r)}>Export row</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataPagination
          page={Math.floor(payoutOffset / payoutLimit) + 1}
          pageSize={payoutLimit}
          total={payoutTotal}
          disabled={payoutLoading}
          onPageChange={(p) => setPayoutOffset((p - 1) * payoutLimit)}
          onPageSizeChange={(size) => {
            setPayoutLimit(size);
            setPayoutOffset(0);
          }}
        />
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
              <TableHead className="text-xs">Market</TableHead>
              <TableHead className="text-xs">Prediction</TableHead>
              <TableHead className="text-xs">Amounts</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Pi payment</TableHead>
              <TableHead className="text-xs">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : "No payment rows for this filter."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">
                    {r.pi_username ?? `User ${r.user_id}`}
                  </TableCell>
                  <TableCell>
                    <MarketCell question={r.market_question} />
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {r.outcome ? (
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 font-semibold ${
                          r.outcome.toUpperCase() === "NO"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                        }`}
                      >
                        {r.outcome.toUpperCase() === "NO" ? "No" : "Yes"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    <span className="ml-1.5 tabular-nums text-muted-foreground">
                      {roundLocale(r.shares)} sh
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="tabular-nums">{formatPiAmount(r.amount)}</span>
                    <span className="text-muted-foreground"> / order </span>
                    <span className="tabular-nums">{formatPiAmount(r.order_pi_amount)}</span>
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

        <DataPagination
          page={Math.floor(offset / limit) + 1}
          pageSize={limit}
          total={total}
          disabled={loading}
          onPageChange={(p) => setOffset((p - 1) * limit)}
          onPageSizeChange={(size) => {
            setLimit(size);
            setOffset(0);
          }}
        />
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetchWithToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { roundLocale } from "@/lib/utils";

type Column = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
};

type KpiConfig = {
  title: string;
  description: string;
  endpoint: (limit: number, offset: number) => string;
  columns: Column[];
};

function outcomeBadge(outcome: unknown) {
  const v = String(outcome ?? "").toUpperCase();
  if (v !== "YES" && v !== "NO") return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${
        v === "NO"
          ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
      }`}
    >
      {v === "NO" ? "No" : "Yes"}
    </span>
  );
}

function truncMid(value: unknown, head = 8, tail = 6): string {
  const s = String(value ?? "").trim();
  if (!s) return "—";
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

const userCol: Column = {
  key: "pi_username",
  label: "User",
  render: (r) => String(r.pi_username ?? `User ${r.user_id ?? ""}`),
};
const marketCol: Column = {
  key: "market_question",
  label: "Market",
  render: (r) => (
    <span className="line-clamp-2 max-w-[220px] text-xs">{String(r.market_question ?? "—")}</span>
  ),
};

const PAYMENT_COLUMNS: Column[] = [
  userCol,
  marketCol,
  { key: "outcome", label: "Prediction", render: (r) => outcomeBadge(r.outcome) },
  { key: "shares", label: "Shares", render: (r) => `${roundLocale(Number(r.shares ?? 0))} sh` },
  {
    key: "amount",
    label: "Amount",
    render: (r) => `${roundLocale(Number(r.amount ?? 0))} π`,
  },
  { key: "status", label: "Status", render: (r) => String(r.status ?? "—") },
  {
    key: "pi_payment_id",
    label: "Pi payment",
    render: (r) => (
      <span className="font-mono text-[11px] text-muted-foreground">{truncMid(r.pi_payment_id)}</span>
    ),
  },
];

const KPI_CONFIG: Record<string, KpiConfig> = {
  received: {
    title: "User-to-App payments received",
    description: "Completed Pi buy payments (user → app).",
    endpoint: (l, o) => `/admin/payments?status=COMPLETED&limit=${l}&offset=${o}`,
    columns: PAYMENT_COLUMNS,
  },
  pending: {
    title: "Pending payments",
    description: "Buy payments awaiting the user's wallet action.",
    endpoint: (l, o) => `/admin/payments?status=PENDING&limit=${l}&offset=${o}`,
    columns: PAYMENT_COLUMNS,
  },
  failed: {
    title: "Failed payments",
    description: "Failed Pi buy-payment records linked to orders.",
    endpoint: (l, o) => `/admin/payments?status=FAILED&limit=${l}&offset=${o}`,
    columns: PAYMENT_COLUMNS,
  },
  mismatch: {
    title: "Payment mismatch warnings",
    description: "Payments whose amount is not explained by the order plus fee.",
    endpoint: (l, o) => `/admin/payments?mismatch_only=true&limit=${l}&offset=${o}`,
    columns: PAYMENT_COLUMNS,
  },
  "payouts-sent": {
    title: "App-to-User payouts sent",
    description: "Winning payouts sent on-chain (with txid) or marked paid manually.",
    endpoint: (l, o) => `/admin/payouts-sent?limit=${l}&offset=${o}`,
    columns: [
      userCol,
      marketCol,
      { key: "outcome", label: "Prediction", render: (r) => outcomeBadge(r.outcome) },
      {
        key: "amount_paid",
        label: "Paid",
        render: (r) => `${roundLocale(Number(r.amount_paid ?? 0))} π`,
      },
      {
        key: "method",
        label: "Method",
        render: (r) =>
          r.method === "on-chain" ? (
            <span className="text-emerald-600 dark:text-emerald-400">On-chain</span>
          ) : (
            <span className="text-amber-600">Manual</span>
          ),
      },
      {
        key: "payout_txid",
        label: "Txid",
        render: (r) => (
          <span className="font-mono text-[11px] text-muted-foreground">{truncMid(r.payout_txid)}</span>
        ),
      },
    ],
  },
  "payout-queue": {
    title: "Manual payout queue",
    description: "Winners on resolved markets still awaiting payout.",
    endpoint: (l, o) => `/admin/payout-queue?status=pending&limit=${l}&offset=${o}`,
    columns: [
      userCol,
      marketCol,
      { key: "outcome", label: "Prediction", render: (r) => outcomeBadge(r.outcome) },
      {
        key: "amount_owed",
        label: "Owed",
        render: (r) => `${roundLocale(Number(r.amount_owed ?? 0))} π`,
      },
      {
        key: "wallet_address",
        label: "Wallet",
        render: (r) => (
          <span className="font-mono text-[11px] text-muted-foreground">{truncMid(r.wallet_address)}</span>
        ),
      },
    ],
  },
};

export const KPI_KEYS = Object.keys(KPI_CONFIG);

export function PaymentKpiDetail({ kpi }: { kpi: string }) {
  const { toast } = useToast();
  const config = KPI_CONFIG[kpi];

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    try {
      const res = await apiFetchWithToken<{ data?: unknown[]; total?: number }>(
        config.endpoint(limit, offset),
        { method: "GET" }
      );
      setRows(Array.isArray(res?.data) ? (res.data as Record<string, unknown>[]) : []);
      setTotal(Number(res?.total ?? 0));
    } catch (e: unknown) {
      toast({
        title: "Load failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [config, limit, offset, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);

  if (!config) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Unknown detail view.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackLink />
      <div>
        <h1 className="text-lg font-semibold">{config.title}</h1>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((c) => (
                  <TableHead key={c.key} className="text-xs">
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={config.columns.length} className="py-8 text-center text-sm text-muted-foreground">
                    {loading ? "Loading…" : "No rows."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={String(r.id ?? r.position_id ?? i)}>
                    {config.columns.map((c) => (
                      <TableCell key={c.key} className="text-xs">
                        {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DataPagination
        page={page}
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
  );
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
      <Link href="/admin/payments">
        <ArrowLeft className="h-4 w-4" /> Back to Payments
      </Link>
    </Button>
  );
}

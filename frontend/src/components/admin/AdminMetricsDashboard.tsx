"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";
import { roundLocalePi } from "@/lib/utils";

type PeriodKey = "today" | "week" | "month" | "year";

type PeriodValue = Record<PeriodKey, number>;

type ClosedUnresolvedMarket = {
  id: number;
  question: string;
  icon?: string | null;
  status: string;
  end_date?: string | null;
  updated_at?: string | null;
};

type AdminMetricsData = {
  market_status: {
    total: number;
    open: number;
    pending: number;
    resolved: number;
  };
  market_count_created: PeriodValue;
  market_count_ended: PeriodValue;
  market_count_resolved: PeriodValue;
  total_pi_purchased: PeriodValue;
  total_fee_generated: PeriodValue;
  total_pi_claimed: PeriodValue;
  user_count_created: PeriodValue;
  suggestion_count_created: PeriodValue;
  closed_unresolved_markets: ClosedUnresolvedMarket[];
};

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString();
}

function formatPi(value: number): string {
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} PI`;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function MetricPeriodTable({
  title,
  values,
  format = formatNumber,
}: {
  title: string;
  values: PeriodValue;
  format?: (value: number) => string;
}) {
  return (
    <div>
      <span className="text-sm">{title}</span>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 pt-2">
        {PERIODS.map((period) => (
          <div key={period.key} className="rounded-md border p-2 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{period.label}</p>
            <p className="text-md font-semibold">{format(values[period.key] ?? 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminMetricsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminMetricsData | null>(null);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await apiFetchWithToken<{ ok: boolean; data?: AdminMetricsData }>("/admin/metrics", {
          method: "GET",
        });
        if (res.ok && res.data) {
          setData(res.data);
        }
      } catch (e: any) {
        toast({
          title: "Metrics load failed",
          description: e?.message || "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [toast]);

  const marketStatus = useMemo(
    () => data?.market_status ?? { total: 0, open: 0, pending: 0, resolved: 0 },
    [data],
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Metrics</CardTitle>
          <CardDescription>Loading platform metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Metrics</CardTitle>
          <CardDescription>No data available.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <span className="text-base">Market Status Overview</span>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 pt-2">
          <div className="rounded-md border p-2 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Total Markets</p>
            <p className="text-md font-semibold">{formatNumber(marketStatus.total)}</p>
          </div>
          <div className="rounded-md border p-2 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-md font-semibold">{formatNumber(marketStatus.open)}</p>
          </div>
          <div className="rounded-md border p-2 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-md font-semibold">{formatNumber(marketStatus.pending)}</p>
          </div>
          <div className="rounded-md border p-2 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Resolved</p>
            <p className="text-md font-semibold">{formatNumber(marketStatus.resolved)}</p>
          </div>
        </div>
      </div>

      <MetricPeriodTable
        title="Created Markets"
        values={data.market_count_created}
      />
      <MetricPeriodTable
        title="Ended Markets"
        values={data.market_count_ended}
      />
      <MetricPeriodTable
        title="Resolved Markets"
        values={data.market_count_resolved}
      />
      <MetricPeriodTable
        title="User Purchased PI"
        values={data.total_pi_purchased}
        format={roundLocalePi}
      />
      <MetricPeriodTable
        title="Generated Fees"
        values={data.total_fee_generated}
        format={roundLocalePi}
      />
      <MetricPeriodTable
        title="Settled PI"
        values={data.total_pi_claimed}
        format={roundLocalePi}
      />
      <MetricPeriodTable
        title="Created Users"
        values={data.user_count_created}
      />
      <MetricPeriodTable
        title="Created Suggestions"
        values={data.suggestion_count_created}
      />

      <div className="pt-4">
        <span className="text-sm">Closed But Unresolved Markets</span>
        <div className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="min-w-60">Question</TableHead>
                <TableHead className="w-40">End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.closed_unresolved_markets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No closed unresolved markets.
                  </TableCell>
                </TableRow>
              ) : (
                data.closed_unresolved_markets.map((market) => (
                  <TableRow key={market.id}>
                    <TableCell>{market.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {market.icon ? (
                          <img
                            src={market.icon}
                            alt={market.question}
                            className="h-10 w-10 rounded-md object-cover border border-border shrink-0"
                            loading="lazy"
                          />
                        ) : null}
                        <Link
                          href={`/admin/markets/${market.id}`}
                          className="text-white underline-offset-4 hover:underline"
                        >
                          {market.question}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(market.end_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

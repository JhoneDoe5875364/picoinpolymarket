"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { PeriodButtonGroup, type PeriodButtonKey } from "@/components/PeriodButtonGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";
import { roundLocalePi } from "@/lib/utils";

type PeriodKey = PeriodButtonKey;

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
  market_count_closed: PeriodValue;
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
  { key: "all", label: "All Time" },
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
  selectedPeriod,
  format = formatNumber,
}: {
  title: string;
  values: PeriodValue;
  selectedPeriod: PeriodKey;
  format?: (value: number) => string;
}) {
  const selectedPeriodLabel = PERIODS.find((period) => period.key === selectedPeriod)?.label ?? "Today";

  return (
    <div>
      <div className="rounded-md border p-2 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{title} ({selectedPeriodLabel})</p>
        <p className="text-md font-semibold">{format(values[selectedPeriod] ?? 0)}</p>
      </div>
    </div>
  );
}

export function AdminMetricsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminMetricsData | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<ClosedUnresolvedMarket | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO">("YES");
  const [isResolving, setIsResolving] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("today");
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

  function openResolveDialog(market: ClosedUnresolvedMarket) {
    setSelectedMarket(market);
    setSelectedOutcome("YES");
    setResolveDialogOpen(true);
  }

  function closeResolveDialog() {
    if (isResolving) return;
    setResolveDialogOpen(false);
    setSelectedMarket(null);
    setSelectedOutcome("YES");
  }

  async function resolveSelectedMarket() {
    if (!selectedMarket || isResolving) return;

    const marketId = selectedMarket.id;
    const outcome = selectedOutcome;
    setIsResolving(true);

    try {
      const res = await apiFetchWithToken<{ ok: boolean; error?: string }>(
        `/admin/markets/resolve?outcome=${outcome}&market_id=${marketId}`,
        {
          method: "POST",
          body: JSON.stringify({ market_id: marketId, outcome }),
        },
      );

      if (!res.ok) {
        throw new Error(res.error || "Unknown error");
      }

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          closed_unresolved_markets: prev.closed_unresolved_markets.filter((market) => market.id !== marketId),
        };
      });

      toast({
        title: "Market resolved",
        description: `Market #${marketId} resolved as ${outcome}.`,
      });
      closeResolveDialog();
    } catch (e: any) {
      toast({
        title: "Resolve failed",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  }

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
      <div className="pt-2 text-right">
        <PeriodButtonGroup selected={selectedPeriod} onSelect={setSelectedPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricPeriodTable
          title="Created Markets"
          values={data.market_count_created}
          selectedPeriod={selectedPeriod}
        />
        <MetricPeriodTable
          title="Closed Markets"
          values={data.market_count_closed}
          selectedPeriod={selectedPeriod}
        />
        <MetricPeriodTable
          title="Resolved Markets"
          values={data.market_count_resolved}
          selectedPeriod={selectedPeriod}
        />
        <MetricPeriodTable
          title="Total Cost Collected"
          values={data.total_pi_purchased}
          selectedPeriod={selectedPeriod}
          format={roundLocalePi}
        />
        <MetricPeriodTable
          title="Fee Generated"
          values={data.total_fee_generated}
          selectedPeriod={selectedPeriod}
          format={roundLocalePi}
        />
        <MetricPeriodTable
          title="Estimated Return Settled"
          values={data.total_pi_claimed}
          selectedPeriod={selectedPeriod}
          format={roundLocalePi}
        />
        <MetricPeriodTable
          title="Created Users"
          values={data.user_count_created}
          selectedPeriod={selectedPeriod}
        />
        <MetricPeriodTable
          title="Created Suggestions"
          values={data.suggestion_count_created}
          selectedPeriod={selectedPeriod}
        />
      </div>

      <div className="pt-4">
        <span className="text-sm">Closed But Unresolved Markets</span>
        <div className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="min-w-60">Question</TableHead>
                <TableHead className="w-40">End Date</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.closed_unresolved_markets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => openResolveDialog(market)}
                      >
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={resolveDialogOpen}
        onOpenChange={(open) => {
          if (isResolving) return;
          if (!open) {
            closeResolveDialog();
            return;
          }
          setResolveDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Market</DialogTitle>
            <DialogDescription>
              {selectedMarket
                ? `Choose the final outcome for market #${selectedMarket.id}.`
                : "Choose the final outcome."}
            </DialogDescription>
          </DialogHeader>

          {selectedMarket ? (
            <div className="flex items-center gap-3 rounded-md border p-3">
              {selectedMarket.icon ? (
                <img
                  src={selectedMarket.icon}
                  alt={selectedMarket.question}
                  className="h-12 w-12 rounded-md object-cover border border-border shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="h-12 w-12 rounded-md border border-border shrink-0 bg-muted" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">{selectedMarket.question}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={selectedOutcome === "YES" ? "default" : "outline"}
              className={selectedOutcome === "YES" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              onClick={() => setSelectedOutcome("YES")}
              disabled={isResolving}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={selectedOutcome === "NO" ? "default" : "outline"}
              className={selectedOutcome === "NO" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
              onClick={() => setSelectedOutcome("NO")}
              disabled={isResolving}
            >
              No
            </Button>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 space-x-0">
            <Button type="button" variant="outline" onClick={closeResolveDialog} disabled={isResolving}>
              Cancel
            </Button>
            <Button type="button" onClick={resolveSelectedMarket} disabled={!selectedMarket || isResolving}>
              {isResolving ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

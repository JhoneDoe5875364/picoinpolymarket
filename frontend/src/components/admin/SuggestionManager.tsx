
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Clock, Layers3, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/ui/data-pagination";
import { useToast } from "@/hooks/use-toast";
import type { Suggestion } from "@/lib/types";
import { Badge } from "../ui/badge";
import { roundLocale } from "@/lib/utils";
import { format } from "date-fns";
import { apiFetchWithToken } from "@/lib/api";

type SuggestionListResult = { items: Suggestion[]; total: number };

type SuggestionSummary = {
  total: number;
  pending: number;
  published: number;
  rejected: number;
};

const listCache = new Map<string, SuggestionListResult>();
const listInFlight = new Map<string, Promise<SuggestionListResult>>();

async function fetchSuggestionList(qs: string): Promise<SuggestionListResult> {
  const cached = listCache.get(qs);
  if (cached) return cached;
  const pending = listInFlight.get(qs);
  if (pending) return pending;

  const request = (async () => {
    const res = await apiFetchWithToken(`/suggestions?${qs}`, { method: "GET" });
    const payload: SuggestionListResult = {
      items: Array.isArray(res?.items) ? res.items : [],
      total: Number(res?.total ?? 0),
    };
    listCache.set(qs, payload);
    return payload;
  })();

  listInFlight.set(qs, request);
  try {
    return await request;
  } finally {
    listInFlight.delete(qs);
  }
}

export function SuggestionManager() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<SuggestionSummary>({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(false);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("status", "pending");
    return params.toString();
  }, [page, limit]);

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const res = await apiFetchWithToken(`/suggestions/summary`, { method: "GET" });
      if (res.ok && res.data) {
        setSummary({
          total: Number(res.data.total ?? 0),
          pending: Number(res.data.pending ?? 0),
          published: Number(res.data.published ?? 0),
          rejected: Number(res.data.rejected ?? 0),
        });
      }
    } catch (e: any) {
      toast({ title: "Summary load failed", description: e.message, variant: "destructive" });
    } finally {
      setSummaryLoading(false);
    }
  }

  const refreshList = async () => {
    listCache.delete(qs);
    setLoading(true);
    try {
      const payload = await fetchSuggestionList(qs);
      setSuggestions(payload.items);
      setTotal(payload.total);
      void loadSummary();
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const payload = await fetchSuggestionList(qs);
        if (cancelled) return;
        setSuggestions(payload.items);
        setTotal(payload.total);
      } catch (e: any) {
        if (cancelled) return;
        toast({ title: "Load failed", description: e.message, variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [qs, toast]);

  useEffect(() => {
    void loadSummary();
  }, []);

  async function rejectSuggestion(suggestion: Suggestion) {
    const confirmed = window.confirm("Reject this suggestion?");
    if (!confirmed) return;
    setIsProcessing(true);
    try {
      const res = await apiFetchWithToken(`/suggestions/${suggestion.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "" }),
      });
      if (!res?.ok) {
        throw new Error(res?.error || "Failed to reject suggestion");
      }
      toast({ title: "Suggestion rejected" });
      await refreshList();
    } catch (e: any) {
      toast({
        title: "Reject failed",
        description: e?.message ?? "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getSummaryBadgeClassName = (kind: "TOTAL" | "PENDING" | "PUBLISHED" | "REJECTED") => {
    switch (kind) {
      case "TOTAL":
        return "border-blue-500 bg-blue-500 text-white hover:bg-blue-500/90";
      case "PENDING":
        return "border-orange-500 bg-orange-500 text-white hover:bg-orange-500/90";
      case "PUBLISHED":
        return "border-green-500 bg-green-500 text-white hover:bg-green-500/90";
      case "REJECTED":
        return "border-red-500 bg-red-500 text-white hover:bg-red-500/90";
      default:
        return "";
    }
  };

  const totalForRate = summary.total > 0 ? summary.total : 1;
  const pendingRate = Math.round((summary.pending / totalForRate) * 100);
  const publishedRate = Math.round((summary.published / totalForRate) * 100);
  const rejectedRate = Math.round((summary.rejected / totalForRate) * 100);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold leading-none tracking-tight">Market Suggestions</h2>
        <p className="text-xs text-muted-foreground">
          Review user suggestions and move to the detail editor for approval.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Total Suggestions</p>
            <Layers3 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.total)}</p>
            <Badge className={getSummaryBadgeClassName("TOTAL")}>100%</Badge>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pending Suggestions</p>
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.pending)}</p>
            <Badge className={getSummaryBadgeClassName("PENDING")}>{pendingRate}%</Badge>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Published Suggestions</p>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.published)}</p>
            <Badge className={getSummaryBadgeClassName("PUBLISHED")}>{publishedRate}%</Badge>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Rejected Suggestions</p>
            <Ban className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.rejected)}</p>
            <Badge className={getSummaryBadgeClassName("REJECTED")}>{rejectedRate}%</Badge>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">Loading suggestions...</p> : null}
        {!loading && suggestions.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">There are no pending market suggestions.</p>
        ) : null}

        {suggestions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Question</TableHead>
                <TableHead className="text-xs hidden">Category</TableHead>
                <TableHead className="text-xs hidden">Start</TableHead>
                <TableHead className="text-xs hidden">End</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell className="text-xs">{suggestion.pi_username || "-"}</TableCell>
                  <TableCell className="min-w-48">
                    <p className="font-medium text-xs">{suggestion.question}</p>
                  </TableCell>
                  <TableCell className="hidden">
                    <Badge variant="outline" className="text-xs">{suggestion.category || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs hidden">
                    {suggestion.start_date ? format(new Date(suggestion.start_date), "MM/dd/yyyy") : "N/A"}
                  </TableCell>
                  <TableCell className="text-xs hidden">
                    {suggestion.end_date ? format(new Date(suggestion.end_date), "MM/dd/yyyy") : "N/A"}
                  </TableCell>
                  <TableCell className="flex min-w-32 items-center gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" asChild>
                      <Link href={`/admin/suggestions/${suggestion.id}`} aria-label="Edit suggestion">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 shrink-0"
                      onClick={() => rejectSuggestion(suggestion)}
                      disabled={isProcessing}
                      aria-label="Reject suggestion"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        <DataPagination
          page={page}
          pageSize={limit}
          total={total}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
        />
      </div>
    </section>
  );
}

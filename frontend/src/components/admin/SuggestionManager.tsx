
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Suggestion } from "@/lib/types";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import { apiFetchWithToken } from "@/lib/api";

type SuggestionListResult = { items: Suggestion[]; total: number };

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
  const [limit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("status", "pending");
    return params.toString();
  }, [page, limit]);

  const refreshList = async () => {
    listCache.delete(qs);
    setLoading(true);
    try {
      const payload = await fetchSuggestionList(qs);
      setSuggestions(payload.items);
      setTotal(payload.total);
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

  return (
    <section>
      <div className="mb-4 space-y-1">
        <h2 className="text-xl font-semibold leading-none tracking-tight">Market Suggestions</h2>
        <p className="text-sm text-muted-foreground">
          Review user suggestions and move to the detail editor for approval.
        </p>
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
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell className="min-w-60">
                    <p className="font-medium">{suggestion.question}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{suggestion.category || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{suggestion.pi_username || "-"}</TableCell>
                  <TableCell className="text-xs">
                    {suggestion.start_date ? format(new Date(suggestion.start_date), "Pp") : "N/A"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {suggestion.end_date ? format(new Date(suggestion.end_date), "Pp") : "N/A"}
                  </TableCell>
                  <TableCell className="space-x-2 min-w-40">
                    <Button size="sm" asChild>
                      <Link href={`/admin/suggestions/${suggestion.id}`}>Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectSuggestion(suggestion)}
                      disabled={isProcessing}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        {total > limit ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
            >
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

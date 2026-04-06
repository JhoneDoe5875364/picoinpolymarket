"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";
import { format } from "date-fns";

type Row = {
  id: string;
  title: string;
  description: string;
  category: string;
  resolved_at: string | null;
  resolved_by_username: string | null;
  resolved_outcome: string | null;
  outcome: string | null;
  created_at: string;
  status: string;
  total_volume: number;
};

export function ResolutionsManager() {
  const { toast } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("resolved_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort_by", sortBy);
    params.set("order", order);
    if (search) params.set("search", search);
    return params.toString();
  }, [page, limit, sortBy, order, search]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setOrder("desc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return order === "asc"
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetchWithToken(`/admin/resolutions?${qs}`, { method: "GET" });
      if (res.ok) {
        setRows(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [qs]);

  const getOutcomeDisplay = (outcome: string | null) => {
    if (!outcome) return "N/A";
    return outcome.toUpperCase();
  };

  const getOutcomeBadgeVariant = (outcome: string | null) => {
    if (outcome === "yes") return "default";
    if (outcome === "no") return "destructive";
    return "secondary";
  };

  const getPayoutStatusDisplay = (payoutStatus: string | null) => {
    if (!payoutStatus) return "N/A";
    return payoutStatus.toUpperCase();
  };

  const getPayoutStatusBadgeVariant = (payoutStatus: string | null) => {
    if (payoutStatus === "completed manually") return "default";
    return "outline";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolved Markets</CardTitle>
        <CardDescription>View resolved prediction markets (read-only).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-64"
          />
          <div className="ml-auto text-sm opacity-70">
            {loading ? "Loading…" : `${rows.length} / ${total}`}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("title")}>
                  Market Title
                  {getSortIcon("title")}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("resolved_outcome")}>
                  Final Outcome
                  {getSortIcon("resolved_outcome")}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("resolved_at")}>
                  Resolved Time
                  {getSortIcon("resolved_at")}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("resolved_by_username")}>
                  Resolved By
                  {getSortIcon("resolved_by_username")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  {m.title}
                </TableCell>
                <TableCell>
                  <Badge variant={getOutcomeBadgeVariant(m.resolved_outcome || m.outcome)}>
                    {getOutcomeDisplay(m.resolved_outcome || m.outcome)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {m.resolved_at ? format(new Date(m.resolved_at), "MM/dd/yyyy HH:mm") : "N/A"}
                </TableCell>
                <TableCell>
                  {m.resolved_by_username || "N/A"}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No resolved markets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {total > limit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page * limit >= total}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

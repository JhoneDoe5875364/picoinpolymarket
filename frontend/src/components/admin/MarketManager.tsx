"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";
import { catCls, statusCls } from "@/lib/utils";
import { format } from "date-fns";

type Status = "open" | "pending_resolution" | "resolved";

type Row = {
  id: string;
  title: string;
  description: string;
  category: string;
  resolves_at: string | null;
  resolved: boolean;
  outcome: string | null;
  created_at: string;
  end_date: string;
  status: Status;
  total_participants: number;
  total_pi: number;
  total_volume: number;
};

export function MarketManager() {
  const { toast } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);

  const [resolveId, setResolveId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort_by", sortBy);
    params.set("order", order);
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return params.toString();
  }, [page, limit, sortBy, order, search, status]);

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
      const res = await apiFetchWithToken(`/admin/markets?${qs}`, { method: "GET" });
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

  async function resolve(outcome: "yes" | "no") {
    if (!resolveId) return;
    const res = await apiFetchWithToken(`/admin/markets/${resolveId}/resolve/${outcome}`, {
      method: "POST",
    });
    if (!res.ok) {
      toast({ title: "Resolve failed", description: res.error || "Unknown error", variant: "destructive" });
    } else {
      toast({ title: "Resolved", description: outcome.toUpperCase() });
      load();
    }
    setResolveId(null);
  }

  async function cancel() {
    if (!cancelId) return;
    const res = await apiFetchWithToken(`/admin/markets/${cancelId}/cancel`, { method: "POST" });
    if (!res.ok) {
      toast({ title: "Cancel failed", description: res.error || "Unknown error", variant: "destructive" });
    } else {
      toast({ title: "Cancelled", description: "Market cancelled" });
      load();
    }
    setCancelId(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Markets</CardTitle>
          <CardDescription>View, edit, resolve, and cancel prediction markets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="w-64"
            />
            <Button variant="outline" onClick={() => setStatus("all")}>All</Button>
            <Button variant="outline" onClick={() => setStatus("open")}>Open</Button>
            <Button variant="outline" onClick={() => setStatus("pending_resolution")}>Pending</Button>
            <Button variant="outline" onClick={() => setStatus("resolved")}>Resolved</Button>
            <div className="ml-auto text-sm opacity-70">
              {loading ? "Loading…" : `${rows.length} / ${total}`}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("title")}>
                    Question
                    {getSortIcon("title")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")}>
                    Status
                    {getSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("category")}>
                    Category
                    {getSortIcon("category")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("created_at")}>
                    Created Date
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("end_date")}>
                    End Time
                    {getSortIcon("end_date")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("total_participants")}>
                    Total Participants
                    {getSortIcon("total_participants")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("total_pi")}>
                    Total PI Forecast
                    {getSortIcon("total_pi")}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.title}</TableCell>
                  <TableCell>
                    <Badge className={`px-2 py-0.5 rounded-full ${statusCls(m.status)}`}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${catCls(m.category)} border`}>{m.category}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(m.created_at), "MM/dd/yyyy")}</TableCell>
                  <TableCell>{format(new Date(m.end_date), "MM/dd/yyyy HH:mm")}</TableCell>
                  <TableCell>{Math.round(m.total_participants).toLocaleString()}</TableCell>
                  <TableCell>{Math.round(m.total_pi).toLocaleString()} π</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <Link href={`/markets/${m.id}`}>
                          <DropdownMenuItem>View Market</DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => setResolveId(m.id)}>Resolve Market</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCancelId(m.id)}>Cancel Market</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Resolve dialog */}
      {resolveId && (
        <AlertDialog open onOpenChange={() => setResolveId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resolve Market</AlertDialogTitle>
              <AlertDialogDescription>Choose the final outcome.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => resolve("no")} className="bg-red-600 hover:bg-red-700">
                Resolve NO
              </AlertDialogAction>
              <AlertDialogAction onClick={() => resolve("yes")} className="bg-green-600 hover:bg-green-700">
                Resolve YES
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel dialog */}
      {cancelId && (
        <AlertDialog open onOpenChange={() => setCancelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel market?</AlertDialogTitle>
              <AlertDialogDescription>This will refund all participants.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Open</AlertDialogCancel>
              <AlertDialogAction onClick={cancel} className="bg-red-600 hover:bg-red-700">
                Cancel Market
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

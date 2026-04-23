"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDot, Clock3, Layers3, MoreHorizontal } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";
import { roundLocale, roundLocalePi } from "@/lib/utils";
import { MarketCreator } from "@/components/admin/MarketCreator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Market } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type Status = "open" | "pending" | "resolved";
type SortField = "question" | "status" | "category" | "start_date" | "end_date" | "traders" | "volume";
type MarketSummary = {
  total: number;
  open: number;
  pending: number;
  resolved: number;
};
const DEFAULT_MARKET_ICON = "/images/markets/market-default.png";


export function MarketManager() {
  const { toast } = useToast();

  const [rows, setRows] = useState<Market[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [sortBy, setSortBy] = useState<SortField>("start_date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MarketSummary>({ total: 0, open: 0, pending: 0, resolved: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String((page - 1) * limit));
    params.set("order", sortBy);
    params.set("ascending", order === "asc" ? "true" : "false");
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return params.toString();
  }, [page, limit, sortBy, order, search, status]);

  const summaryQs = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("active_only", "true");
    return params.toString();
  }, [search]);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetchWithToken(`/markets?${qs}`, { method: "GET" });
      if (res.ok) {
        setRows(res.data || []);
        setTotal(res.total ?? res.data?.length ?? 0);
      }
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const res = await apiFetchWithToken(`/markets/summary?${summaryQs}`, { method: "GET" });
      if (res.ok && res.data) {
        setSummary({
          total: Number(res.data.total ?? 0),
          open: Number(res.data.open ?? 0),
          pending: Number(res.data.pending ?? 0),
          resolved: Number(res.data.resolved ?? 0),
        });
      }
    } catch (e: any) {
      toast({ title: "Summary load failed", description: e.message, variant: "destructive" });
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => { load(); }, [qs]);
  useEffect(() => { loadSummary(); }, [summaryQs]);

  async function resolve(outcome: "YES" | "NO") {
    if (!selectedMarketId) return;
    const res = await apiFetchWithToken(`/markets/resolve?outcome=${outcome}&market_id=${selectedMarketId}`, {
      method: "POST",
    });
    if (!res.ok) {
      toast({ title: "Resolve failed", description: res.error || "Unknown error", variant: "destructive" });
    } else {
      toast({ title: "Resolved", description: outcome.toUpperCase() });
      load();
      loadSummary();
    }
    setSelectedMarketId(null);
  }

  async function close() {
    if (!selectedMarketId) return;
    const res = await apiFetchWithToken(`/markets/close?market_id=${selectedMarketId}`, { method: "POST" });
    if (!res.ok) {
      toast({ title: "Close failed", description: res.error || "Unknown error", variant: "destructive" });
    } else {
      toast({ title: "Closed", description: "Market closed" });
      load();
      loadSummary();
    }
    setSelectedMarketId(null);
  }

  const totalForRate = summary.total > 0 ? summary.total : 1;
  const openRate = Math.round((summary.open / totalForRate) * 100);
  const pendingRate = Math.round((summary.pending / totalForRate) * 100);
  const resolvedRate = Math.round((summary.resolved / totalForRate) * 100);

  return (
    <>
      <section className="space-y-3">
          <h2 className="text-2xl leading-none tracking-tight">Manage Markets</h2>
          <p className="text-sm text-muted-foreground">View, create, edit, resolve, and close markets.</p>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Markets</p>
                <Layers3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xl font-semibold">{summaryLoading ? "..." : roundLocale(summary.total)}</p>
                <Badge variant="outline">100%</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Open</p>
                <CircleDot className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xl font-semibold">{summaryLoading ? "..." : roundLocale(summary.open)}</p>
                <Badge variant="default">{openRate}%</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Pending</p>
                <Clock3 className="h-4 w-4 text-orange-500" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xl font-semibold">{summaryLoading ? "..." : roundLocale(summary.pending)}</p>
                <Badge variant="secondary">{pendingRate}%</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Resolved</p>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xl font-semibold">{summaryLoading ? "..." : roundLocale(summary.resolved)}</p>
                <Badge variant="success">{resolvedRate}%</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2 md:flex md:items-center md:gap-2 md:space-y-0">
            <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-2">
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                className="col-span-2 w-full md:w-64"
              />
              <Button
                className="col-span-1 md:hidden"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-2">
              <Select
                value={status}
                onValueChange={(value) => {
                  setPage(1);
                  setStatus(value as "all" | Status);
                }}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setPage(1);
                  setSortBy(value as SortField);
                }}
              >
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start_date">Start Date</SelectItem>
                  <SelectItem value="end_date">End Date</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="traders">Traders</SelectItem>
                  <SelectItem value="volume">Volume (PI)</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={order}
                onValueChange={(value) => {
                  setPage(1);
                  setOrder(value as "asc" | "desc");
                }}
              >
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">DESC</SelectItem>
                  <SelectItem value="asc">ASC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:ml-auto md:flex md:items-center md:gap-2">
              <Button
                className="hidden md:inline-flex"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Id</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Traders</TableHead>
                <TableHead>Volume(PI)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-center">{m.id}</TableCell>
                  <TableCell className="min-w-60">
                    <div className="flex items-start gap-2">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted/20">
                        <img
                          src={typeof m.icon === "string" && m.icon.trim().length > 0 ? m.icon : DEFAULT_MARKET_ICON}
                          alt={m.question ?? "Market image"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            if (e.currentTarget.src !== DEFAULT_MARKET_ICON) {
                              e.currentTarget.src = DEFAULT_MARKET_ICON;
                            }
                          }}
                        />
                      </div>
                      <p className="line-clamp-2">{m.question}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {m.status}
                  </TableCell>
                  <TableCell className="text-center">
                    {m.category}
                  </TableCell>
                  <TableCell className="text-center">{format(new Date(m.start_date ?? ""), "MM/dd/yyyy")}</TableCell>
                  <TableCell className="text-center">{format(new Date(m.end_date ?? ""), "MM/dd/yyyy")}</TableCell>
                  <TableCell className="text-center">{roundLocale(m.traders ?? 0)}</TableCell>
                  <TableCell className="text-center">{roundLocalePi(m.volume ?? 0)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Link href={`/markets/${m.id}`}>View Market</Link></DropdownMenuItem>
                        <DropdownMenuItem><Link href={`/admin/markets/${m.id}`}>Edit Market</Link></DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-green-500"
                          onClick={() => {
                            setSelectedMarketId(m.id.toString());
                            setResolveDialogOpen(true);
                          }}
                        >
                          Resolve Market
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => {
                            setSelectedMarketId(m.id.toString());
                            setCloseDialogOpen(true);
                          }}
                        >
                          Close Market
                        </DropdownMenuItem>
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
      </section>

      {/* Resolve dialog */}
      {resolveDialogOpen && (
        <AlertDialog open={resolveDialogOpen} onOpenChange={() => setResolveDialogOpen(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resolve Market</AlertDialogTitle>
              <AlertDialogDescription>Choose the final outcome.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => resolve("NO")} className="bg-red-600 hover:bg-red-700">
                Resolve NO
              </AlertDialogAction>
              <AlertDialogAction onClick={() => resolve("YES")} className="bg-green-600 hover:bg-green-700">
                Resolve YES
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Close dialog */}
      {closeDialogOpen && (
        <AlertDialog open={closeDialogOpen} onOpenChange={() => setCloseDialogOpen(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close market?</AlertDialogTitle>
              <AlertDialogDescription>This will refund all participants and close the market.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={close} className="bg-red-600 hover:bg-red-700">
                Close Market
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Create Market</DialogTitle>
            <DialogDescription>Create a new prediction market.</DialogDescription>
          </DialogHeader>
          <MarketCreator
            onCreated={() => {
              setCreateDialogOpen(false);
              load();
              loadSummary();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

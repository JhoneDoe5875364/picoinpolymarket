"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type Category = "all" | "politics" | "economy" | "tech" | "sports" | "crypto" | "esports" | "finance" | "geopolitics" | "culture" | "weather";
type SortField = "id" | "question" | "status" | "category" | "start_date" | "end_date" | "traders" | "volume";
type MarketSummary = {
  total: number;
  open: number;
  pending: number;
  resolved: number;
};
const DEFAULT_MARKET_ICON = "/images/markets/market-default.png";
const PAGE_SIZE = 20;


export function MarketManager() {
  const { toast } = useToast();

  const [rows, setRows] = useState<Market[]>([]);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [order, setOrder] = useState<SortField>("end_date");
  const [ascending, setAscending] = useState<"ASC" | "DESC">("DESC");
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [summary, setSummary] = useState<MarketSummary>({ total: 0, open: 0, pending: 0, resolved: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const rowsRef = useRef<Market[]>([]);
  const totalRef = useRef(0);
  const nextOffsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isInitialLoadingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  const listBaseQs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("order", order);
    params.set("ascending", ascending === "ASC" ? "true" : "false");
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    return params.toString();
  }, [order, ascending, search, status, category]);

  const summaryQs = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("active_only", "true");
    return params.toString();
  }, [search]);

  const loadMarkets = useCallback(async (reset: boolean) => {
    if ((!reset && (!hasMoreRef.current || isLoadingMoreRef.current)) || (reset && isInitialLoadingRef.current)) return;

    if (reset) {
      isInitialLoadingRef.current = true;
      setIsInitialLoading(true);
    } else {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
    }

    const offset = reset ? 0 : nextOffsetRef.current;
    const params = new URLSearchParams(listBaseQs);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));

    try {
      const res = await apiFetchWithToken(`/markets?${params.toString()}`, { method: "GET" });
      if (res.ok) {
        const incoming = Array.isArray(res.data) ? res.data : [];
        const hasServerTotal = res.total !== undefined && res.total !== null;
        const incomingTotal = hasServerTotal ? Number(res.total) : (reset ? incoming.length : rowsRef.current.length + incoming.length);
        const mergedRows = reset ? incoming : [...rowsRef.current, ...incoming];
        const computedNextOffset = offset + incoming.length;
        const reachedEnd = hasServerTotal ? (incoming.length < PAGE_SIZE || computedNextOffset >= incomingTotal) : incoming.length < PAGE_SIZE;

        setRows(mergedRows);
        setTotal(incomingTotal);
        setNextOffset(computedNextOffset);
        setHasMore(!reachedEnd);
        rowsRef.current = mergedRows;
        totalRef.current = incomingTotal;
        nextOffsetRef.current = computedNextOffset;
        hasMoreRef.current = !reachedEnd;
      }
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" });
    } finally {
      if (reset) {
        isInitialLoadingRef.current = false;
        setIsInitialLoading(false);
      } else {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [listBaseQs, toast]);

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

  const refreshMarkets = useCallback(() => {
    setRows([]);
    setTotal(0);
    setNextOffset(0);
    setHasMore(true);
    rowsRef.current = [];
    totalRef.current = 0;
    nextOffsetRef.current = 0;
    hasMoreRef.current = true;
    void loadMarkets(true);
  }, [loadMarkets]);

  useEffect(() => {
    setRows([]);
    setTotal(0);
    setNextOffset(0);
    setHasMore(true);
    rowsRef.current = [];
    totalRef.current = 0;
    nextOffsetRef.current = 0;
    hasMoreRef.current = true;
    void loadMarkets(true);
  }, [listBaseQs, loadMarkets]);

  useEffect(() => { loadSummary(); }, [summaryQs]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || isInitialLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          void loadMarkets(false);
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isInitialLoading, isLoadingMore, loadMarkets]);

  async function resolve(outcome: "YES" | "NO") {
    if (!selectedMarketId) return;
    const res = await apiFetchWithToken(`/admin/markets/resolve?outcome=${outcome}&market_id=${selectedMarketId}`, {
      method: "POST",
    });
    if (!res.ok) {
      toast({ title: "Resolve failed", description: res.error || "Unknown error", variant: "destructive" });
    } else {
      toast({ title: "Resolved", description: outcome.toUpperCase() });
      refreshMarkets();
      loadSummary();
    }
    setSelectedMarketId(null);
  }

  async function close() {
    if (!selectedMarketId) return;
    const res = await apiFetchWithToken(`/admin/markets/close?market_id=${selectedMarketId}`, { method: "POST" });
    if (!res.ok) {
      toast({ title: "Close failed", description: res.error || "Unknown error", variant: "destructive" });
    } else {
      toast({ title: "Closed", description: "Market closed" });
      refreshMarkets();
      loadSummary();
    }
    setSelectedMarketId(null);
  }

  const totalForRate = summary.total > 0 ? summary.total : 1;
  const openRate = Math.round((summary.open / totalForRate) * 100);
  const pendingRate = Math.round((summary.pending / totalForRate) * 100);
  const resolvedRate = Math.round((summary.resolved / totalForRate) * 100);
  const selectedMarket = useMemo(
    () => rows.find((market) => market.id.toString() === selectedMarketId) ?? null,
    [rows, selectedMarketId],
  );

  return (
    <>
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Manage Markets</h2>
          <p className="text-xs text-muted-foreground">View, create, edit, resolve, and close markets.</p>
        </div>
        <div className="grid grid-cols-2 gap-1 md:gap-2 xl:grid-cols-4">
          <div className="rounded-lg border p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Markets</p>
              <Layers3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.total)}</p>
              <Badge variant="outline">100%</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Open</p>
              <CircleDot className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.open)}</p>
              <Badge variant="default">{openRate}%</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Unresolved</p>
              <Clock3 className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.pending)}</p>
              <Badge variant="secondary">{pendingRate}%</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Resolved</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.resolved)}</p>
              <Badge variant="success">{resolvedRate}%</Badge>
            </div>
          </div>
        </div>
        <div className="space-y-2 md:flex md:items-center md:gap-2 md:space-y-0">
          <div className="grid grid-cols-3 gap-1 md:flex md:items-center md:gap-2">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              className="col-span-2 w-full md:w-64 text-xs"
            />
            <Button
              className="col-span-1 md:hidden text-xs"
              onClick={() => setCreateDialogOpen(true)}
            >
              Create
            </Button>
          </div>
          <div className="grid grid-cols-4 md:flex md:items-center gap-1 md:gap-2">
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value as "all" | Category);
              }}
            >
              <SelectTrigger className="w-full md:w-40 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All</SelectItem>
                <SelectItem value="politics" className="text-xs">Politics</SelectItem>
                <SelectItem value="sports" className="text-xs">Sports</SelectItem>
                <SelectItem value="crypto" className="text-xs">Crypto</SelectItem>
                <SelectItem value="esports" className="text-xs">Esports</SelectItem>
                <SelectItem value="finance" className="text-xs">Finance</SelectItem>
                <SelectItem value="geopolitics" className="text-xs">Geopolitics</SelectItem>
                <SelectItem value="tech" className="text-xs">Tech</SelectItem>
                <SelectItem value="culture" className="text-xs">Culture</SelectItem>
                <SelectItem value="economy" className="text-xs">Economy</SelectItem>
                <SelectItem value="weather" className="text-xs">Weather</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as "all" | Status);
              }}
            >
              <SelectTrigger className="w-full md:w-40 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All</SelectItem>
                <SelectItem value="open" className="text-xs">Open</SelectItem>
                <SelectItem value="pending" className="text-xs">Unresolved</SelectItem>
                <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={order}
              onValueChange={(value) => {
                setOrder(value as SortField);
              }}
            >
              <SelectTrigger className="w-full md:w-44 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id" className="text-xs hidden">#</SelectItem>
                <SelectItem value="start_date" className="text-xs hidden">Start Date</SelectItem>
                <SelectItem value="end_date" className="text-xs">End Date</SelectItem>
                <SelectItem value="question" className="text-xs">Question</SelectItem>
                <SelectItem value="status" className="text-xs hidden">Status</SelectItem>
                <SelectItem value="category" className="text-xs">Category</SelectItem>
                <SelectItem value="traders" className="text-xs">Traders</SelectItem>
                <SelectItem value="volume" className="text-xs">Volume (π)</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={ascending}
              onValueChange={(value) => {
                setAscending(value as "ASC" | "DESC");
              }}
            >
              <SelectTrigger className="w-full md:w-36 text-xs">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC" className="text-xs">DESC</SelectItem>
                <SelectItem value="ASC" className="text-xs">ASC</SelectItem>
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
              <TableHead className="text-xs hidden">Id</TableHead>
              <TableHead className="text-xs">Question</TableHead>
              <TableHead className="text-xs hidden">Status</TableHead>
              <TableHead className="text-xs hidden">Category</TableHead>
              <TableHead className="text-xs hidden">Start Date</TableHead>
              <TableHead className="text-xs">End Date</TableHead>
              <TableHead className="text-xs hidden">Traders</TableHead>
              <TableHead className="text-xs">Volume</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-center text-xs hidden">{m.id}</TableCell>
                <TableCell className="min-w-40">
                  <div className="flex items-start items-center gap-1 md:gap-2">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border bg-muted/20">
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
                    <p className="line-clamp-2 text-xs">{m.question}</p>
                  </div>
                </TableCell>
                <TableCell className="text-xs hidden">
                  {m.status}
                </TableCell>
                <TableCell className="text-xs hidden">
                  {m.category}
                </TableCell>
                <TableCell className="text-xs hidden">{format(new Date(m.start_date ?? ""), "MM/dd/yyyy")}</TableCell>
                <TableCell className="text-xs">{format(new Date(m.end_date ?? ""), "MM/dd/yyyy")}</TableCell>
                <TableCell className="text-xs hidden">{roundLocale(m.traders ?? 0)}</TableCell>
                <TableCell className="text-xs">{roundLocalePi(m.volume ?? 0)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Link href={`/admin/markets/detail/${m.id}`}>View Market Metrics</Link></DropdownMenuItem>
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


        {isInitialLoading && (
          <p className="text-sm text-muted-foreground">Loading markets...</p>
        )}
        {!isInitialLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No markets found.</p>
        )}
        {rows.length > 0 && (
          <div className="space-y-1">
            <div ref={loadMoreRef} className="h-1 w-full" />
            {isLoadingMore && <p className="text-sm text-muted-foreground">Loading more markets...</p>}
            {!hasMore && total > 0 && <p className="text-sm text-muted-foreground">All markets loaded.</p>}
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
            {selectedMarket ? (
              <div className="flex items-center gap-3 rounded-md border p-3">
                <img
                  src={
                    typeof selectedMarket.icon === "string" && selectedMarket.icon.trim().length > 0
                      ? selectedMarket.icon
                      : DEFAULT_MARKET_ICON
                  }
                  alt={selectedMarket.question ?? "Market image"}
                  className="h-12 w-12 rounded-md object-cover border border-border shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    if (e.currentTarget.src !== DEFAULT_MARKET_ICON) {
                      e.currentTarget.src = DEFAULT_MARKET_ICON;
                    }
                  }}
                />
                <p className="text-sm font-medium break-words">{selectedMarket.question}</p>
              </div>
            ) : null}
            <AlertDialogFooter className="flex-row justify-end gap-2 space-x-0">
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
            {selectedMarket ? (
              <div className="flex items-center gap-3 rounded-md border p-3">
                <img
                  src={
                    typeof selectedMarket.icon === "string" && selectedMarket.icon.trim().length > 0
                      ? selectedMarket.icon
                      : DEFAULT_MARKET_ICON
                  }
                  alt={selectedMarket.question ?? "Market image"}
                  className="h-12 w-12 rounded-md object-cover border border-border shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    if (e.currentTarget.src !== DEFAULT_MARKET_ICON) {
                      e.currentTarget.src = DEFAULT_MARKET_ICON;
                    }
                  }}
                />
                <p className="text-sm font-medium break-words">{selectedMarket.question}</p>
              </div>
            ) : null}
            <AlertDialogFooter className="flex-row justify-end gap-2 space-x-0">
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
              refreshMarkets();
              loadSummary();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

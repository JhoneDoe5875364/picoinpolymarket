"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";
import { roundLocale, roundLocalePi } from "@/lib/utils";
import { format } from "date-fns";
import { Market } from "@/lib/types";

type Status = "open" | "pending" | "resolved";


export function MarketManager() {
  const { toast } = useToast();

  const [rows, setRows] = useState<Market[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
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
      const res = await apiFetchWithToken(`/markets?${qs}`, { method: "GET" });
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

  useEffect(() => { load(); }, [qs]);

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
    }
    setSelectedMarketId(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Markets</CardTitle>
          <CardDescription>View, edit, resolve, and close prediction markets.</CardDescription>
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
            <Button variant="outline" onClick={() => setStatus("pending")}>Pending</Button>
            <Button variant="outline" onClick={() => setStatus("resolved")}>Resolved</Button>
            <div className="ml-auto text-sm opacity-70">
              {loading ? "Loading…" : `${rows.length} / ${total}`}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" className="p-2" onClick={() => handleSort("title")}>
                    Question
                    {getSortIcon("title")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-2" onClick={() => handleSort("status")}>
                    Status
                    {getSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-2" onClick={() => handleSort("category")}>
                    Category
                    {getSortIcon("category")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-2" onClick={() => handleSort("created_at")}>
                    Created Date
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-2" onClick={() => handleSort("end_date")}>
                    End Date
                    {getSortIcon("end_date")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-2" onClick={() => handleSort("traders")}>
                    Traders
                    {getSortIcon("traders")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-2" onClick={() => handleSort("total_pi")}>
                    Volume (PI)
                    {getSortIcon("volume")}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="min-w-60 line-clamp-2">{m.question}</TableCell>
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
        </CardContent>
      </Card>

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
    </>
  );
}

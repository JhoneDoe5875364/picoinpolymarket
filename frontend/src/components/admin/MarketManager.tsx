"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type Status = "open" | "pending" | "resolved";
type SortField = "question" | "status" | "category" | "start_date" | "end_date" | "traders" | "volume";


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
        <CardContent className="space-y-3">
          <CardTitle>Manage Markets</CardTitle>
          <CardDescription>View, create, edit, resolve, and close markets.</CardDescription>
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
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

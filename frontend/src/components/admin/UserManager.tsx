
"use client";

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers3, ShieldCheck, ShieldOff, UserCheck, UserMinus, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { apiFetchWithToken } from '@/lib/api';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, roundLocale } from '@/lib/utils';

type UserSummary = {
  total: number;
  active: number;
  suspended: number;
  banned: number;
};

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"pi_username" | "created_at" | "balance" | "status">("created_at");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "BANNED">("ALL");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<UserSummary>({ total: 0, active: 0, suspended: 0, banned: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    params.set("sort_by", sortBy);
    params.set("order", order);
    params.set("status", statusFilter);
    if (search) params.set("search", search);
    return params.toString();
  }, [offset, limit, sortBy, order, statusFilter, search]);

  const summaryQs = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    return params.toString();
  }, [search]);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetchWithToken(`/users?${qs}`, { method: "GET" });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [qs]);

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const res = await apiFetchWithToken(`/users/summary?${summaryQs}`, { method: "GET" });
      if (res.ok && res.data) {
        setSummary({
          total: Number(res.data.total ?? 0),
          active: Number(res.data.active ?? 0),
          suspended: Number(res.data.suspended ?? 0),
          banned: Number(res.data.banned ?? 0),
        });
      }
    } catch (e: any) {
      toast({ title: "Summary load failed", description: e.message, variant: "destructive" });
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => { loadSummary(); }, [summaryQs]);

  const handleUpdateStatus = async (userId: string, status: User['status']) => {
    try {
      const res = await apiFetchWithToken(`/users/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          status: status
        })
      });
      if (res.ok) {
        const updatedUser = res.user;
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === updatedUser.id ? { ...user, ...updatedUser } : user
          )
        );
        void loadSummary();
        toast({
          title: `User ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          description: `User ${updatedUser?.pi_username} has been ${status}.`,
          variant: status === 'BANNED' ? 'destructive' : 'default',
        });
      }
    } catch (e: any) {
      toast({ title: "Update Status failed", description: e.message, variant: "destructive" });
    }
  };

  const getStatusBadgeClassName = (status: User['status']) => {
    switch (status) {
      case 'ALL': return 'border-blue-500 bg-blue-500 text-white hover:bg-blue-500/90';
      case 'ACTIVE': return 'border-green-500 bg-green-500 text-white hover:bg-green-500/90';
      case 'SUSPENDED': return 'border-orange-500 bg-orange-500 text-white hover:bg-orange-500/90';
      case 'BANNED': return 'border-red-500 bg-red-500 text-white hover:bg-red-500/90';
      default: return '';
    }
  };

  const getStatusTextColorClassName = (status: User['status']) => {
    switch (status) {
      case 'ALL': return 'text-blue-500';
      case 'ACTIVE': return 'text-green-500';
      case 'SUSPENDED': return 'text-orange-500';
      case 'BANNED': return 'text-red-500';
      default: return '';
    }
  };

  const totalForRate = summary.total > 0 ? summary.total : 1;
  const activeRate = Math.round((summary.active / totalForRate) * 100);
  const suspendedRate = Math.round((summary.suspended / totalForRate) * 100);
  const bannedRate = Math.round((summary.banned / totalForRate) * 100);

  return (
    <>
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-none tracking-tight">User Management</h2>
          <p className="text-xs text-muted-foreground">View, manage, and take action on user accounts.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Users</p>
              <Layers3 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.total)}</p>
              <Badge className={getStatusBadgeClassName('ALL')}>100%</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Active</p>
              <UserCheck className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.active)}</p>
              <Badge className={getStatusBadgeClassName('ACTIVE')}>
                {activeRate}%
              </Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Suspended</p>
              <UserMinus className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.suspended)}</p>
              <Badge className={getStatusBadgeClassName('SUSPENDED')}>
                {suspendedRate}%
              </Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Banned</p>
              <UserX className="h-4 w-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-md font-semibold">{summaryLoading ? "..." : roundLocale(summary.banned)}</p>
              <Badge className={getStatusBadgeClassName('BANNED')}>
                {bannedRate}%
              </Badge>
            </div>
          </div>
        </div>
        <div>
          <div className="md:flex md:justify-between md:items-center gap-1 md:gap-2">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => { setOffset(0); setSearch(e.target.value); }}
              className="w-full md:w-64 text-xs mb-2 md:mb-0"
            />
            <div className="grid grid-cols-3 md:flex md:items-center gap-1 md:gap-2">
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value: "ALL" | "ACTIVE" | "SUSPENDED" | "BANNED") => {
                    setOffset(0);
                    setStatusFilter(value);
                  }}
                >
                  <SelectTrigger className="min-w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="BANNED">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(value: "pi_username" | "created_at" | "balance" | "status") => {
                    setOffset(0);
                    setSortBy(value);
                  }}
                >
                  <SelectTrigger className="min-w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Member Since</SelectItem>
                    <SelectItem value="pi_username">Username</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={order}
                  onValueChange={(value: "ASC" | "DESC") => {
                    setOffset(0);
                    setOrder(value);
                  }}
                >
                  <SelectTrigger className="min-w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESC">Desc</SelectItem>
                    <SelectItem value="ASC">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='truncate text-xs hidden'>#</TableHead>
                <TableHead className='text-xs'>Username</TableHead>
                <TableHead className='text-xs'>Status</TableHead>
                <TableHead className='truncate text-xs'>Created Date</TableHead>
                <TableHead className='text-xs'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs truncate text-center hidden">{user.id}</TableCell>
                  <TableCell className="font-medium text-xs">{user.pi_username}</TableCell>
                  <TableCell className="font-medium text-xs">
                    <span className={getStatusTextColorClassName(user.status)}>{user.status}</span>
                  </TableCell>
                  <TableCell className='truncate text-xs'>{format(new Date(user.created_at), 'P')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.status !== 'BANNED' ? (
                        <Button
                          variant="outline"
                          className="text-red-500"
                          size="sm"
                          onClick={async () => handleUpdateStatus(user.id, 'BANNED')}
                        >
                          <ShieldOff className="h-4 w-4 text-red-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="text-green-500"
                          size="sm"
                          onClick={async () => handleUpdateStatus(user.id, 'ACTIVE')}
                        >
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}

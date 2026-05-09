
"use client";

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/lib/types';
import { PeriodButtonGroup, type PeriodButtonKey } from '@/components/PeriodButtonGroup';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  Layers3,
  ShieldCheck,
  ShieldOff,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserX,
  Wallet,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { apiFetchWithToken } from '@/lib/api';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roundLocale } from '@/lib/utils';

type TopUserActivity = {
  user_id: number;
  pi_username: string;
  trade_count: number;
};

type UserSummary = {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  active_traders_by_period: Record<PeriodButtonKey, number>;
  users_with_open_positions: number;
  users_with_resolved_positions: number;
  users_with_pending_payments: number;
  users_with_failed_payments: number;
  top_users_by_activity: TopUserActivity[];
};

const emptyActiveTradersByPeriod = (): Record<PeriodButtonKey, number> => ({
  today: 0,
  week: 0,
  month: 0,
  year: 0,
  all: 0,
});

const emptySummary = (): UserSummary => ({
  total: 0,
  active: 0,
  suspended: 0,
  banned: 0,
  active_traders_by_period: emptyActiveTradersByPeriod(),
  users_with_open_positions: 0,
  users_with_resolved_positions: 0,
  users_with_pending_payments: 0,
  users_with_failed_payments: 0,
  top_users_by_activity: [],
});

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
  const [summary, setSummary] = useState<UserSummary>(emptySummary);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTradersPeriod, setActiveTradersPeriod] = useState<PeriodButtonKey>('today');

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
        const d = res.data;
        const top = Array.isArray(d.top_users_by_activity) ? d.top_users_by_activity : [];
        const ap = d.active_traders_by_period;
        const byPeriod = emptyActiveTradersByPeriod();
        if (ap && typeof ap === 'object') {
          (Object.keys(byPeriod) as PeriodButtonKey[]).forEach((k) => {
            byPeriod[k] = Number((ap as Record<string, unknown>)[k] ?? 0);
          });
        }
        setSummary({
          total: Number(d.total ?? 0),
          active: Number(d.active ?? 0),
          suspended: Number(d.suspended ?? 0),
          banned: Number(d.banned ?? 0),
          active_traders_by_period: byPeriod,
          users_with_open_positions: Number(d.users_with_open_positions ?? 0),
          users_with_resolved_positions: Number(d.users_with_resolved_positions ?? 0),
          users_with_pending_payments: Number(d.users_with_pending_payments ?? 0),
          users_with_failed_payments: Number(d.users_with_failed_payments ?? 0),
          top_users_by_activity: top.map((u: TopUserActivity) => ({
            user_id: Number(u.user_id),
            pi_username: String(u.pi_username ?? ''),
            trade_count: Number(u.trade_count ?? 0),
          })),
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

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Users with open positions</p>
              <Wallet className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-md font-semibold">
              {summaryLoading ? '...' : roundLocale(summary.users_with_open_positions)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Users with resolved positions</p>
              <Layers3 className="h-4 w-4 text-teal-500" />
            </div>
            <p className="mt-2 text-md font-semibold">
              {summaryLoading ? '...' : roundLocale(summary.users_with_resolved_positions)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Users with pending payments</p>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
            <p className="mt-2 text-md font-semibold">
              {summaryLoading ? '...' : roundLocale(summary.users_with_pending_payments)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Users with failed payments</p>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="mt-2 text-md font-semibold">
              {summaryLoading ? '...' : roundLocale(summary.users_with_failed_payments)}
            </p>
          </div>
        </div>

        <div className="space-y-1 pt-2 hidden">
          <p className="text-xs font-medium text-muted-foreground">Trading &amp; engagement</p>
          <p className="text-[11px] text-muted-foreground">
            Active traders: distinct members with at least one trade in the period (UTC), matching admin metrics ranges.
            Top activity uses the last 30 days.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="flex gap-2 items-center justify-between">
              <p className="text-xs text-muted-foreground">Active traders</p>
              <PeriodButtonGroup
                selected={activeTradersPeriod}
                onSelect={setActiveTradersPeriod}
                className="shrink-0 self-end sm:self-auto"
              />
            </div>
            <p className="mt-2 text-md font-semibold">
              {summaryLoading
                ? '...'
                : roundLocale(summary.active_traders_by_period[activeTradersPeriod] ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Largest users by activity</p>
                <p className="text-[11px] text-muted-foreground">Top 5 by trade count (last 30 days)</p>
              </div>
              <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            {summaryLoading ? (
              <p className="text-xs text-muted-foreground">...</p>
            ) : summary.top_users_by_activity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trades in this window (or no matching users).</p>
            ) : (
              <ul className="space-y-1.5">
                {summary.top_users_by_activity.map((u, i) => (
                  <li
                    key={`${u.user_id}-${i}`}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate font-medium">{u.pi_username || `User ${u.user_id}`}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {roundLocale(u.trade_count)} trades
                    </span>
                  </li>
                ))}
              </ul>
            )}
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

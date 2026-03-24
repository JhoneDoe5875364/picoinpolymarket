
"use client";

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ShieldOff, ShieldCheck, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { apiFetchWithToken } from '@/lib/api';
import { Input } from '../ui/input';

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"pi_username" | "created_at" | "balance" | "status">("created_at");
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

  const handleUpdateStatus = async (userId: string, status: User['status']) => {
    try {
      const res = await apiFetchWithToken(`/users/status`, {
        method: "POST",
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
        toast({
          title: `User ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          description: `User ${updatedUser?.pi_username} has been ${status}.`,
          variant: status === 'banned' ? 'destructive' : 'default',
        });
      }
    } catch (e: any) {
      toast({ title: "Update Status failed", description: e.message, variant: "destructive" });
    }
  };

  const handleSort = (column: "pi_username" | "created_at" | "balance" | "status") => {
    if (sortBy === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setOrder("desc");
    }
  };

  const getSortIcon = (column: "pi_username" | "created_at" | "balance" | "status") => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return order === "asc"
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getStatusBadgeVariant = (status: User['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'outline';
      case 'banned': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View, manage, and take action on user accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="w-64"
            />
            <div className="ml-auto text-sm opacity-70">
              {loading ? "Loading…" : `${users.length} / ${total}`}
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("pi_username")} className="h-8 px-2 lg:px-3">
                    Username
                    {getSortIcon("pi_username")}
                  </Button>
                </TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")} className="h-8 px-2 lg:px-3">
                    Status
                    {getSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead className='truncate'>
                  <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-8 px-2 lg:px-3">
                    Member Since
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.pi_username}</TableCell>
                  <TableCell className="font-mono text-xs truncate">{user.id}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                  </TableCell>
                  <TableCell className='truncate'>{format(new Date(user.created_at), 'P')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {user.status !== 'banned' ? (
                          <DropdownMenuItem onSelect={async () => handleUpdateStatus(user.id, 'banned')} className="text-destructive focus:text-destructive">
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Ban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={async () => handleUpdateStatus(user.id, 'active')}>
                            <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                            Unban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

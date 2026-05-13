'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn, roundLocalePi, toNumber } from '@/lib/utils';
import { apiFetchWithToken } from '@/lib/api';
import { PaymentHistoryToolbar } from '@/components/profile/PaymentHistoryToolbar';
import type { PaymentStatusTabValue } from '@/components/profile/PaymentStatusTabs';

type ProfilePaymentHistoryTabProps = {
  isActive: boolean;
};

const PAGE_SIZE = 10;

export type PaymentHistoryRow = {
  id: string;
  marketTitle: string;
  marketImage: string | null;
  orderSide: string;
  amount: number;
  status: string;
  piPaymentId: string | null;
  txid: string | null;
  createdAt: string;
};

type StatusFilter = PaymentStatusTabValue;

const SORT_OPTIONS = ['Newest', 'Oldest', 'Amount (high)', 'Amount (low)', 'Status (A–Z)'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function normalizePaymentRow(row: Record<string, unknown>, index: number): PaymentHistoryRow {
  return {
    id: String(row?.id ?? index),
    marketTitle: String(row?.question ?? 'Untitled market'),
    marketImage: row?.icon ? String(row.icon) : null,
    orderSide: String(row?.side ?? ''),
    amount: toNumber(row?.amount ?? 0),
    status: String(row?.status ?? ''),
    piPaymentId: row?.pi_payment_id != null ? String(row.pi_payment_id) : null,
    txid: row?.txid != null ? String(row.txid) : null,
    createdAt: String(row?.created_at ?? ''),
  };
}

function mapSortToApi(sort: SortOption): { order: string; ascending: boolean } {
  switch (sort) {
    case 'Newest':
      return { order: 'created_at', ascending: false };
    case 'Oldest':
      return { order: 'created_at', ascending: true };
    case 'Amount (high)':
      return { order: 'amount', ascending: false };
    case 'Amount (low)':
      return { order: 'amount', ascending: true };
    case 'Status (A–Z)':
      return { order: 'status', ascending: true };
    default:
      return { order: 'created_at', ascending: false };
  }
}

function buildPaymentsParams(args: {
  userId: string;
  status: StatusFilter;
  search: string;
  offset: number;
  sort: SortOption;
}): URLSearchParams {
  const { order, ascending } = mapSortToApi(args.sort);
  const params = new URLSearchParams({
    user_id: args.userId,
    status: args.status,
    limit: String(PAGE_SIZE),
    offset: String(args.offset),
    order,
    ascending: String(ascending),
  });
  if (args.search.trim()) {
    params.set('search', args.search.trim());
  }
  return params;
}

async function fetchPaymentPage(args: {
  userId: string;
  status: StatusFilter;
  search: string;
  offset: number;
  sort: SortOption;
}): Promise<{ rows: Record<string, unknown>[]; total: number }> {
  const params = buildPaymentsParams(args);
  const res = await apiFetchWithToken<{
    data?: Record<string, unknown>[];
    total?: number;
  }>(`/users/payments?${params.toString()}`, { method: 'GET' });
  const rows = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.total === 'number' ? res.total : rows.length;
  return { rows, total };
}

function piSentReturned(status: string, amount: number): {
  sent: number | null;
  returned: number | null;
  note: string | null;
} {
  if (status === 'COMPLETED') {
    return { sent: amount, returned: null, note: null };
  }
  if (status === 'CANCELLED') {
    return { sent: null, returned: amount, note: null };
  }
  if (status === 'PENDING' || status === 'APPROVED') {
    return {
      sent: null,
      returned: null,
      note: `In progress · ${roundLocalePi(amount)} π`,
    };
  }
  if (status === 'FAILED') {
    return {
      sent: null,
      returned: null,
      note: `Not collected · ${roundLocalePi(amount)} π`,
    };
  }
  return { sent: null, returned: null, note: null };
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'border-green-600 bg-green-600 text-white hover:bg-green-600/90';
    case 'PENDING':
      return 'border-orange-500 bg-orange-500 text-white hover:bg-orange-500/90';
    case 'APPROVED':
      return 'border-blue-500 bg-blue-500 text-white hover:bg-blue-500/90';
    case 'FAILED':
      return 'border-red-500 bg-red-500 text-white hover:bg-red-500/90';
    case 'CANCELLED':
      return 'border-muted-foreground bg-muted text-foreground hover:bg-muted/90';
    default:
      return '';
  }
}

function formatTxCell(txid: string | null, piPaymentId: string | null) {
  const lines: { label: string; value: string }[] = [];
  if (txid && txid.trim()) {
    lines.push({ label: 'Tx', value: txid.trim() });
  }
  if (piPaymentId && piPaymentId.trim()) {
    lines.push({ label: 'Pi', value: piPaymentId.trim() });
  }
  if (lines.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="space-y-1.5 font-mono text-[11px] leading-snug">
      {lines.map((line) => (
        <div key={line.label} className="min-w-0">
          <span className="text-muted-foreground">{line.label}: </span>
          <span className="break-all text-foreground">{line.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfilePaymentHistoryTab({ isActive }: ProfilePaymentHistoryTabProps) {
  const { ppxUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('Newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsLoadingMore, setPaymentsLoadingMore] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const nextOffsetRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = payments.length < totalCount;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;

    async function loadInitial() {
      setPaymentsLoading(true);
      setPaymentsError(null);
      setPayments([]);
      setTotalCount(0);
      nextOffsetRef.current = 0;

      try {
        const userId = ppxUser?.id?.toString() ?? '';
        if (!userId) {
          setPaymentsError('Sign in to view payment history.');
          return;
        }
        const { rows, total } = await fetchPaymentPage({
          userId,
          status: statusFilter,
          search: debouncedSearch,
          offset: 0,
          sort: sortBy,
        });
        if (cancelled) return;

        setPayments(rows.map((row, i) => normalizePaymentRow(row, i)));
        setTotalCount(total);
        nextOffsetRef.current = rows.length;
      } catch (error: unknown) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load payments.';
        setPaymentsError(message);
      } finally {
        if (!cancelled) {
          setPaymentsLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [ppxUser?.id, debouncedSearch, isActive, statusFilter, sortBy]);

  useEffect(() => {
    if (!isActive || paymentsLoading || paymentsLoadingMore || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadMoreInFlightRef.current) return;

        loadMoreInFlightRef.current = true;
        setPaymentsLoadingMore(true);
        try {
          const userId = ppxUser?.id?.toString() ?? '';
          if (!userId) return;
          const currentOffset = nextOffsetRef.current;
          const { rows, total } = await fetchPaymentPage({
            userId,
            status: statusFilter,
            search: debouncedSearch,
            offset: currentOffset,
            sort: sortBy,
          });
          const normalized = rows.map((row, i) => normalizePaymentRow(row, currentOffset + i));
          setPayments((prev) => [...prev, ...normalized]);
          setTotalCount(total);
          nextOffsetRef.current += normalized.length;
        } catch {
          setTotalCount((t) => t);
        } finally {
          loadMoreInFlightRef.current = false;
          setPaymentsLoadingMore(false);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [
    ppxUser?.id,
    debouncedSearch,
    hasMore,
    isActive,
    statusFilter,
    paymentsLoading,
    paymentsLoadingMore,
    sortBy,
  ]);

  return (
    <div className="space-y-3">
      <PaymentHistoryToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        sortOptions={SORT_OPTIONS}
        onSortChange={(value) => setSortBy(value as SortOption)}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      {paymentsError ? (
        <Card>
          <CardContent>
            <p className="py-6 text-sm text-destructive">{paymentsError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="uppercase tracking-wide text-xs">Market</TableHead>
                <TableHead className="text-right uppercase tracking-wide text-xs">Pi sent</TableHead>
                <TableHead className="text-right uppercase tracking-wide text-xs">Pi returned</TableHead>
                <TableHead className="uppercase tracking-wide text-xs">Transaction IDs</TableHead>
                <TableHead className="uppercase tracking-wide text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`pay-skel-${index}`}>
                    <TableCell colSpan={5}>
                      <div className="h-12 animate-pulse rounded-md bg-muted/40" />
                    </TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No payment history yet. Completed or pending Pi payments for your orders will appear here.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => {
                  const { sent, returned, note } = piSentReturned(p.status, p.amount);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="min-w-[200px] align-top">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            {p.marketImage ? (
                              <img
                                src={p.marketImage}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                              {p.marketTitle}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Order · {p.orderSide || '—'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                              {p.createdAt ? format(new Date(p.createdAt), 'Pp') : '—'}
                            </p>
                            {note ? <p className="mt-1 text-[11px] text-muted-foreground">{note}</p> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-right text-sm font-semibold tabular-nums md:text-base">
                        {sent != null ? (
                          <span className="text-foreground">{roundLocalePi(sent)} π</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-right text-sm font-semibold tabular-nums md:text-base">
                        {returned != null ? (
                          <span className="text-foreground">{roundLocalePi(returned)} π</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] align-top text-xs">
                        {formatTxCell(p.txid, p.piPaymentId)}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge className={cn('text-[10px] font-semibold', statusBadgeClass(p.status))}>
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {hasMore && !paymentsLoading ? (
        <div ref={sentinelRef} className="h-6" aria-hidden="true" />
      ) : null}
      {paymentsLoadingMore ? (
        <p className="text-center text-sm text-muted-foreground">Loading more…</p>
      ) : null}
    </div>
  );
}

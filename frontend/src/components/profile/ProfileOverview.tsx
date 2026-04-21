'use client';

import { useMemo } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Pencil } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ProfileOverview() {
  const { authUser } = useAuth();
  const profileName = useMemo(() => {
    return (
      authUser?.wallet_address ??
      authUser?.address ??
      authUser?.pi_username ??
      '0x7883590f9f3Dc4...'
    );
  }, [authUser]);

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="space-y-5 p-3 sm:p-4">
          <div className="flex items-start items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className="h-14 w-14 shrink-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 20% 20%, #ed1c24 0%, #c4001d 35%, #3c4df8 75%, #4e01a8 100%)',
                }}
              />
              <div className="min-w-0 items-center">
                <h1 className="truncate text-xl sm:text-3xl font-bold leading-tight">{profileName}</h1>
                <p className="text-sm sm:text-md text-muted-foreground">Joined Mar 2026 · 0 views</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">π 0.00</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Positions Value</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">π 0.00</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Biggest Win</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">0</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Predictions</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="w-full">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Deposit
            </Button>
            <Button
              variant="outline"
              className="w-full text-muted-foreground hover:text-foreground"
              disabled
            >
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="space-y-6 p-3 sm:space-y-7 sm:p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Profit/Loss</p>
              <p className="text-2xl sm:text-3xl font-bold leading-none">π 0.00</p>
              <p className="mt-2 text-sm text-muted-foreground">Past Day</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-end gap-2 text-xs font-semibold text-muted-foreground">
                <button
                  type="button"
                  className="rounded-md bg-primary/15 px-2 py-1 text-primary hover:bg-primary/20"
                >
                  1D
                </button>
                <button type="button" className="rounded-md px-2 py-1 hover:bg-secondary">
                  1W
                </button>
                <button type="button" className="rounded-md px-2 py-1 hover:bg-secondary">
                  1M
                </button>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 hover:bg-secondary"
                >
                  ALL
                </button>
              </div>
            </div>
          </div>

          <div className="h-20 rounded-md bg-gradient-to-r from-primary/30 via-primary/15 to-transparent" />
        </CardContent>
      </Card>
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  ChevronsUpDown,
  Link as LinkIcon,
  Pencil,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SORT_OPTIONS = [
  'Value',
  'Profit/Loss $',
  'Profit/Loss %',
  'Traded',
  'Alphabetically',
  'Average Price',
  'Current Price',
] as const;

export default function ProfilePage() {
  const { authUser } = useAuth();
  const [positionFilter, setPositionFilter] = useState<'active' | 'closed'>('active');
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>('Value');

  const profileName = useMemo(() => {
    return (
      authUser?.wallet_address ??
      authUser?.address ??
      authUser?.pi_username ??
      '0x7883590f9f3Dc4...'
    );
  }, [authUser]);

  return (
    <div className="container mx-auto space-y-6 px-2.5 py-4 sm:space-y-7 sm:px-6 sm:py-6 lg:px-8">
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

      <section className="space-y-3">
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="h-auto gap-4 bg-transparent p-0">
            <TabsTrigger
              value="positions"
              className="px-0 text-lg sm:text-xl font-bold data-[state=active]:shadow-none"
            >
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="px-0 text-lg sm:text-xl font-bold data-[state=active]:shadow-none"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-3">
            <div className="space-y-3 md:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex rounded-lg border border-border bg-muted/40 p-1">
                  <button
                    type="button"
                    onClick={() => setPositionFilter('active')}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                      positionFilter === 'active'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'bg-background/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setPositionFilter('closed')}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                      positionFilter === 'closed'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'bg-background/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Closed
                  </button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 min-w-[7.3rem] justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        {sortBy}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => setSortBy(option)}
                        className="flex items-center justify-between"
                      >
                        {option}
                        {sortBy === option ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search positions" className="pl-9" />
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="flex rounded-lg border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setPositionFilter('active')}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                    positionFilter === 'active'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setPositionFilter('closed')}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                    positionFilter === 'closed'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Closed
                </button>
              </div>

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search positions" className="pl-9" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 min-w-[7.3rem] justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {sortBy}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onSelect={() => setSortBy(option)}
                      className="flex items-center justify-between"
                    >
                      {option}
                      {sortBy === option ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Card className="hidden overflow-hidden sm:block">
              <CardContent className="space-y-8">
                <div className="grid grid-cols-[1.5fr_0.4fr_0.4fr] gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Market <ChevronsUpDown className="h-3 w-3" />
                  </span>
                  <span className="flex items-center gap-1">
                    Avg <ChevronsUpDown className="h-3 w-3" />
                  </span>
                  <span>Current</span>
                </div>
                <p className="py-8 text-center text-muted-foreground">No positions found</p>
              </CardContent>
            </Card>
            <p className="py-3 text-center text-muted-foreground sm:hidden">No positions found</p>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent>
                <p className="py-10 text-center text-muted-foreground">No activity found</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

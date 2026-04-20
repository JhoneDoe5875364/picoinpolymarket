// src/app/account/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowDownCircle, ArrowUpCircle, Award, Copy, Download, Gift, Lightbulb, Receipt } from 'lucide-react';
import { SuggestMarketForm } from '@/components/market/SuggestMarketForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, OpenPosition, Transaction, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { apiFetchWithToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';



function AccountSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-6 w-80" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>In-Play</CardTitle>
            <CardDescription>Total amount in open markets.</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift className="text-accent" />Referral Program</CardTitle>
          <CardDescription>Share your code and earn 30% of the transaction fees from your referrals.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Portfolio & Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-64" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  const supa = useMemo(supabaseBrowser, []);
  const { toast } = useToast();
  const { authUser } = useAuth();

  const { accessToken } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [inPlayBalance, setInPlayBalance] = useState(0);

  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supa.auth.getSession();
      const t = data.session?.access_token ?? null;
      if (mounted) setToken(t);
    })();
    return () => { mounted = false; };
  }, [supa]);

  useEffect(() => {
    if (!accessToken) return;
    if (loading) return;
    (async () => {
      setLoading(true);
      await Promise.all([loadCurrentUser(), loadOpenPositions(), loadRecentActivity(), loadHistory(1)]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (authUser) {
      const getBalance = async () => {
        try {
          const {
            in_play_balance
          } = await apiFetchWithToken("/users/balance", {
            method: "GET",
          });

          setInPlayBalance(in_play_balance);
        } catch (err: any) {
          console.error("Failed to get balance:", err);
          alert(err.message || "Error fetching balance");
        }
      };

      getBalance();
    }
  }, [authUser]);

  async function loadCurrentUser() {
    const res = await apiFetchWithToken('/account/info', { method: "GET" });
    setCurrentUser(res?.info ?? {});
  }

  async function loadOpenPositions() {
    const res = await apiFetchWithToken('/account/open-positions', { method: "GET" });
    setOpenPositions(res?.rows ?? []);
  }

  async function loadRecentActivity() {
    const res = await apiFetchWithToken('/account/recent-activity', { method: "GET" });
    setRecentActivity(res?.rows ?? []);
  }

  async function loadHistory(page = 1) {
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    const res = await apiFetchWithToken(`/account/history?${params}`, { method: "GET" });
    setHistory(res?.rows ?? []);
    setHistoryTotal(res?.total ?? 0);
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="text-green-500" />;
      case 'withdrawal': return <ArrowDownCircle className="text-red-500" />;
      case 'prediction-yes':
      case 'prediction-no': return <Receipt className="text-blue-400" />;
      case 'claim-payouts': return <Award className="text-yellow-500" />;
      case 'referral-bonus': return <Gift className="text-pink-500" />;
      default: return <Receipt />;
    }
  }

  const getTransactionAmountClass = (type: Transaction['type'], amount: number) => {
    if (type === 'deposit' || type === 'claim-payouts' || type === 'referral-bonus') {
      return "text-green-400";
    }
    if (amount < 0) {
      return "text-red-400";
    }
    return "text-foreground";
  }

  if (!isMounted || !currentUser) {
    return <AccountSkeleton />;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome, {currentUser?.pi_username || "Guest"}</h1>
          <p className="text-muted-foreground">Here's a summary of your account and activity.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Lightbulb className="mr-2 h-4 w-4" />
              Suggest a Market
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Suggest a New Market</DialogTitle>
              <DialogDescription>
                Have a great idea for a prediction market? Fill out the form below. If it's approved, you'll be notified!
              </DialogDescription>
            </DialogHeader>
            <SuggestMarketForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>In-Play</CardTitle>
            <CardDescription>Total amount in open markets.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inPlayBalance.toFixed(2)} π</p>
          </CardContent>
        </Card>
      </div>

      {false && <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift className="text-accent" />Referral Program</CardTitle>
          <CardDescription>Share your code and earn 30% of the transaction fees from your referrals.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input value={currentUser?.referral_code} readOnly />
            <Button variant="outline" size="icon" onClick={() => currentUser?.referral_code && navigator.clipboard.writeText(currentUser.referral_code)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>}

      <Card>
        <CardHeader>
          <CardTitle>Portfolio & Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="positions">
            <TabsList className="flex justify-start w-full overflow-x-auto whitespace-nowrap gap-1 px-1">
              <TabsTrigger value="positions" className="flex-shrink-0">Open Positions</TabsTrigger>
              <TabsTrigger value="activity" className="flex-shrink-0">Recent Activity</TabsTrigger>
              <TabsTrigger value="history" className="flex-shrink-0">History</TabsTrigger>
            </TabsList>
            <TabsContent value="positions">
              {openPositions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Market Title</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Total Volume</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openPositions.map((p) => {
                        return (
                          <TableRow key={p.position_id}>
                            <TableCell className="font-medium max-w-xs truncate">{p.market_title ?? 'Unknown Market'}</TableCell>
                            <TableCell>
                              <Badge variant={p.side === 'yes' ? 'default' : 'destructive'} className={p.side === 'yes' ? 'bg-green-600' : 'bg-red-600'}>{p.side.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell className='truncate'>{p.amount.toFixed(2)} π</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Open</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground p-8 text-center">You have no open positions.</p>
              )}
            </TabsContent>
            <TabsContent value="activity">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market Title</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Total Volume</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((item) => (
                      <TableRow key={item.position_id}>
                        <TableCell className="max-w-xs truncate">{item.market_title}</TableCell>
                        <TableCell>
                          <Badge variant={item.side === 'yes' ? 'default' : 'destructive'} className={item.side === 'yes' ? 'bg-green-600' : 'bg-red-600'}>{item.side.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className='truncate'>{(item.amount ?? 0).toFixed(2)} π</TableCell>
                        <TableCell>
                          <Badge variant={item.side === item.outcome ? 'default' : 'secondary'} className={item.side === item.outcome ? 'bg-green-500' : ''}>{item.side === item.outcome ? "won" : "open"}</Badge>
                        </TableCell>
                        <TableCell className='truncate'>{format(new Date(item.date), 'PP p')}</TableCell>
                        {/* <TableCell>{item.date}</TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="history">
              <div className="hidden flex justify-end mb-4">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            {getTransactionIcon(tx.type)}
                            <span className="capitalize whitespace-nowrap">{tx.type.replace('-', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{tx.details}</TableCell>
                        <TableCell className={`font-medium ${getTransactionAmountClass(tx.type, tx.pi_amount)} truncate`}>
                          {tx.pi_amount > 0 ? `+${tx.pi_amount.toFixed(2)}` : tx.pi_amount.toFixed(2)} π
                        </TableCell>
                        <TableCell className='truncate'>{isMounted ? format(new Date(tx.date), 'PP p') : ''}</TableCell>
                        <TableCell>
                          <Badge variant={tx.status === 'completed' ? 'default' : (tx.status === 'pending' ? 'secondary' : 'destructive')}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

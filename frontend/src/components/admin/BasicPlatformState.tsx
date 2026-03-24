"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, CheckCircle2, Lock, History } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";

type PlatformState = {
  total_users: number;
  open_markets: number;
  resolved_markets: number;
  locked_pi: number;
  historical_pi: number;
};

export function BasicPlatformState() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PlatformState | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetchWithToken(`/admin/platform_state`, { method: "GET" });
      if (res.ok) {
        setData({
          total_users: res.total_users || 0,
          open_markets: res.open_markets || 0,
          resolved_markets: res.resolved_markets || 0,
          locked_pi: res.locked_pi || 0,
          historical_pi: res.historical_pi || 0,
        });
      }
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const formatPi = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Platform State</CardTitle>
        <CardDescription>
          High-level snapshot of platform statistics (read-only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading…</div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.total_users.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Markets</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.open_markets.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Currently active markets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Markets</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.resolved_markets.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Markets that have been resolved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Locked Pi</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPi(data.locked_pi)}</div>
                <p className="text-xs text-muted-foreground">Pi currently locked in open markets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Historical Pi Collected</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPi(data.historical_pi)}</div>
                <p className="text-xs text-muted-foreground">Total Pi collected (before fees/payouts)</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  );
}

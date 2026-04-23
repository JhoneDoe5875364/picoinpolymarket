"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { MarketEditor } from "@/components/admin/MarketEditor";

export default function AdminMarketEditPage() {
  const { ppxUser } = useAuth();
  const params = useParams<{ market_id: string }>();
  const [isMounted, setIsMounted] = useState(false);
  const isSuperAdmin = ppxUser?.role === "superadmin";
  const marketId = Array.isArray(params?.market_id) ? params.market_id[0] : params?.market_id;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 lg:px-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading market editor...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <ShieldAlert className="text-destructive" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to edit markets.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!marketId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Invalid Market</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not resolve market id from the route.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <MarketEditor marketId={marketId} />
    </div>
  );
}

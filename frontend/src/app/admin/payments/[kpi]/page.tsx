"use client";

import { use, useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { PaymentKpiDetail } from "@/components/admin/PaymentKpiDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function AdminPaymentKpiPage({
  params,
}: {
  params: Promise<{ kpi: string }>;
}) {
  const { kpi } = use(params);
  const { ppxUser } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const isSuperAdmin = ppxUser?.role === "superadmin";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 lg:px-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading…</p>
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
            <p>Your current role cannot access this admin section.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PaymentKpiDetail kpi={kpi} />
    </div>
  );
}

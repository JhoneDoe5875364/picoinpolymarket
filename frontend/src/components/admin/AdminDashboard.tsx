"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

interface AdminDashboardProps {
  title: string;
  description?: string;
  children: ReactNode;
  allowedRoles?: Array<"admin" | "superadmin">;
}

function AdminPageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground mt-2">Loading Admin Dashboard...</p>
    </div>
  );
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <ShieldAlert className="text-destructive" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminDashboard({
  title,
  description = "Manage your application's data and users.",
  children,
  allowedRoles = ["admin", "superadmin"],
}: AdminDashboardProps) {
  const { ppxUser } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <AdminPageSkeleton />;
  }

  if (ppxUser?.role !== "superadmin" && ppxUser?.role !== "admin") {
    return <AccessDenied message="You do not have permission to view this page." />;
  }

  if (!allowedRoles.includes(ppxUser.role)) {
    return <AccessDenied message="Your current role cannot access this admin section." />;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {children}
    </div>
  );
}

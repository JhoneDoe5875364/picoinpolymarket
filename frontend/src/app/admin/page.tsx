
'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { ShieldAlert, Loader2, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCreator } from '@/components/admin/MarketCreator';
import { MarketManager } from '@/components/admin/MarketManager';
import { MarketViewer } from '@/components/admin/MarketViewer';
import { UserManager } from '@/components/admin/UserManager';
import { SuggestionManager } from '@/components/admin/SuggestionManager';
import { FraudReport } from '@/components/admin/FraudReport';
import SeedButton from '@/components/admin/SeedButton';
import { useAuth } from '@/context/AuthContext';
import { apiFetchWithToken } from '@/lib/api';
import { ResolutionsManager } from '@/components/admin/ResolutionsManager';
import { BasicPlatformState } from '@/components/admin/BasicPlatformState';

function AdminPageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground mt-2">Loading Admin Dashboard...</p>
    </div>
  )
}

function AccessDenied() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2"><ShieldAlert className="text-destructive" /> Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to view this page.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function SystemTools() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Database /> System Tools</CardTitle>
        <CardDescription>
          Use these tools to perform administrative actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section>
          <h3 className="text-lg font-semibold mb-2">Seed Database</h3>
          <p className="opacity-80 mb-3 text-sm">Creates a single test market via Cloud Function.</p>
          <SeedButton />
        </section>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { accessToken } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      setLoading(true);
      await Promise.all([loadCurrentUser()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function loadCurrentUser() {
    const res = await apiFetchWithToken('/account/info', { method: "GET" });
    setCurrentUser(res?.info ?? {});
  }

  if (!isMounted) {
    return <AdminPageSkeleton />;
  }

  if (currentUser?.role != "superadmin" && currentUser?.role != "admin") {
    return <AccessDenied />;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your application's data and users.</p>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="flex justify-start w-full overflow-x-auto whitespace-nowrap gap-1 px-1">
          {currentUser?.role == "superadmin" && (
            <>
              {/* <TabsTrigger value="system" className="flex-shrink-0">System</TabsTrigger> */}
              <TabsTrigger value="create" className="flex-shrink-0">Create Market</TabsTrigger>
              <TabsTrigger value="manage" className="flex-shrink-0">Manage Markets</TabsTrigger>
              <TabsTrigger value="suggestions" className="flex-shrink-0">Suggestions</TabsTrigger>
              <TabsTrigger value="users" className="flex-shrink-0">Users</TabsTrigger>
              <TabsTrigger value="platform_state" className="flex-shrink-0">Basic Platform State</TabsTrigger>
              {/* <TabsTrigger value="fraud" className="flex-shrink-0">Fraud Report</TabsTrigger> */}
            </>
          )}
          {currentUser?.role == "admin" && (
            <>
              <TabsTrigger value="view" className="flex-shrink-0">Markets</TabsTrigger>
              <TabsTrigger value="resolutions" className="flex-shrink-0">Resolutions</TabsTrigger>
              <TabsTrigger value="platform_state" className="flex-shrink-0">Basic Platform State</TabsTrigger>
            </>
          )}
        </TabsList>

        {currentUser?.role == "superadmin" && (
          <>
            {/* <TabsContent value="system" className="mt-6"><SystemTools /></TabsContent> */}
            <TabsContent value="create" className="mt-6"><MarketCreator /></TabsContent>
            <TabsContent value="manage" className="mt-6"><MarketManager /></TabsContent>
            <TabsContent value="suggestions" className="mt-6"><SuggestionManager /></TabsContent>
            <TabsContent value="users" className="mt-6"><UserManager /></TabsContent>
            <TabsContent value="platform_state" className="mt-6"><BasicPlatformState /></TabsContent>
            {/* <TabsContent value="fraud" className="mt-6"><FraudReport /></TabsContent> */}
          </>
        )}
        {currentUser?.role == "admin" && (
          <>
            <TabsContent value="view" className="mt-6"><MarketViewer /></TabsContent>
            <TabsContent value="resolutions" className="mt-6"><ResolutionsManager /></TabsContent>
            <TabsContent value="platform_state" className="mt-6"><BasicPlatformState /></TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

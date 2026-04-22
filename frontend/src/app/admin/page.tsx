
'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCreator } from '@/components/admin/MarketCreator';
import { MarketManager } from '@/components/admin/MarketManager';
import { MarketViewer } from '@/components/admin/MarketViewer';
import { UserManager } from '@/components/admin/UserManager';
import { SuggestionManager } from '@/components/admin/SuggestionManager';
import { useAuth } from '@/context/AuthContext';
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

export default function AdminPage() {
  const { ppxUser } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <AdminPageSkeleton />;
  }

  if (ppxUser?.role != "superadmin" && ppxUser?.role != "admin") {
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
          {ppxUser?.role == "superadmin" && (
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
          {ppxUser?.role == "admin" && (
            <>
              <TabsTrigger value="view" className="flex-shrink-0">Markets</TabsTrigger>
              <TabsTrigger value="resolutions" className="flex-shrink-0">Resolutions</TabsTrigger>
              <TabsTrigger value="platform_state" className="flex-shrink-0">Basic Platform State</TabsTrigger>
            </>
          )}
        </TabsList>

        {ppxUser?.role == "superadmin" && (
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
        {ppxUser?.role == "admin" && (
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

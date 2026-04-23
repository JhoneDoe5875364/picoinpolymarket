"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { SuggestionEditor } from "@/components/admin/SuggestionEditor";

export default function AdminSuggestionEditPage() {
  const { ppxUser } = useAuth();
  const params = useParams<{ suggestion_id: string }>();
  const [isMounted, setIsMounted] = useState(false);
  const isAdmin = ppxUser?.role === "superadmin" || ppxUser?.role === "admin";
  const suggestionId = Array.isArray(params?.suggestion_id) ? params.suggestion_id[0] : params?.suggestion_id;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 lg:px-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading suggestion editor...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <ShieldAlert className="text-destructive" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to edit suggestions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!suggestionId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Invalid Suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not resolve suggestion id from the route.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <SuggestionEditor suggestionId={suggestionId} />
    </div>
  );
}

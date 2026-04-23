"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SuggestionManager } from "@/components/admin/SuggestionManager";
import { ResolutionsManager } from "@/components/admin/ResolutionsManager";
import { useAuth } from "@/context/AuthContext";

export default function AdminSuggestionsPage() {
  const { ppxUser } = useAuth();
  const isSuperAdmin = ppxUser?.role === "superadmin";

  return (
    <AdminDashboard title="Suggestions">
      {isSuperAdmin ? <SuggestionManager /> : <ResolutionsManager />}
    </AdminDashboard>
  );
}

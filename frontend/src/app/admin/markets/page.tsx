"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { MarketManager } from "@/components/admin/MarketManager";
import { MarketViewer } from "@/components/admin/MarketViewer";
import { useAuth } from "@/context/AuthContext";

export default function AdminMarketsPage() {
  const { ppxUser } = useAuth();
  const isSuperAdmin = ppxUser?.role === "superadmin";

  return (
    <AdminDashboard title="Markets">
      {isSuperAdmin ? (
        <MarketManager />
      ) : (
        <MarketViewer />
      )}
    </AdminDashboard>
  );
}

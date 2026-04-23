"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManager } from "@/components/admin/UserManager";

export default function AdminUsersPage() {
  return (
    <AdminDashboard title="Users" allowedRoles={["superadmin"]}>
      <UserManager />
    </AdminDashboard>
  );
}

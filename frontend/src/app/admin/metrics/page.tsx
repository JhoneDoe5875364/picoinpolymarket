"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { BasicPlatformState } from "@/components/admin/BasicPlatformState";

export default function AdminMetricsPage() {
  return (
    <AdminDashboard title="Metrics">
      <BasicPlatformState />
    </AdminDashboard>
  );
}

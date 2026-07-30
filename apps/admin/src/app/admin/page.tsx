import { Suspense } from "react";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";

export default function AdminDashboardPage() {
  return <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải dashboard…</div>}><DashboardOverview /></Suspense>;
}

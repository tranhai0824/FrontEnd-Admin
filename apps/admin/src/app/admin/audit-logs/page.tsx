import { Suspense } from "react";
import { AuditLogManagement } from "@/features/audit-logs/audit-log-management";

export default function AuditLogsPage() {
  return <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải nhật ký…</div>}><AuditLogManagement /></Suspense>;
}

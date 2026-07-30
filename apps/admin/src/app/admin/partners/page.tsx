import { Suspense } from "react";
import { PartnerManagement } from "@/features/partners/partner-management";

export default function PartnersPage() {
  return <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải đối tác…</div>}><PartnerManagement /></Suspense>;
}

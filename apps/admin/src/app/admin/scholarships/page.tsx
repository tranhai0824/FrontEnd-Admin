import { Suspense } from "react";
import { ScholarshipManagement } from "@/features/scholarships/scholarship-management";
export default function ScholarshipsPage() { return <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải học bổng…</div>}><ScholarshipManagement /></Suspense>; }

import { Suspense } from "react";
import { ConsultingManagement } from "@/features/consulting/consulting-management";
export default function ConsultingPage() { return <Suspense fallback={<p>Đang tải hàng đợi…</p>}><ConsultingManagement /></Suspense>; }

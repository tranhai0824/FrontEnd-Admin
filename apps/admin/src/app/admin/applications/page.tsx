import { ApplicationManagement } from "@/features/applications/application-management";
import { Suspense } from "react";
export default function ApplicationsPage() { return <Suspense fallback={<p>Đang tải hồ sơ…</p>}><ApplicationManagement /></Suspense>; }

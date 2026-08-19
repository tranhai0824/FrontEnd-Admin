"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PacmanLoader } from "@/components/shared/pacman-loader";
import { StatCard } from "@/features/dashboard/stat-card";
import { TrendChart, type DashboardTrendPoint } from "@/features/dashboard/trend-chart";
import { RecentActivity, type ActivityItem } from "@/features/dashboard/recent-activity";
import { authClient } from "@/lib/auth-client";

// Shape khớp đúng response thật của GET /admin/dashboard (Backend-for-admin) — không còn lớp
// "normalizeDashboard" cũ vốn vứt bỏ phần lớn field thật (partners, saves, trends.scholarships,
// activities...) rồi tự bịa số 0 cố định để lấp chỗ trống, gây ra hiển thị "[object Object]" khi field
// bị đọc nhầm tên (vd. kpis.publishedScholarships không tồn tại, field thật là kpis.scholarships).
type Metric = { total: number; current: number; previous: number; growth: number };
type TrendPoint = { date: string; value: number };
type DashboardData = {
  period: { days: number };
  attention: {
    pendingScholarships: number; overdueScholarships24h: number; overdueScholarships72h: number;
    pendingOrganizations: number; unverifiedUsers: number; failedJobs: number;
  };
  kpis: { users: Metric; scholarships: Metric; applications: Metric; partners: Metric };
  funnel: { views: number; saves: number; applications: number };
  trends: { users: TrendPoint[]; scholarships: TrendPoint[]; applications: TrendPoint[] };
  activities: ActivityItem[];
};

async function getDashboard(days: number): Promise<DashboardData> {
  const response = await authClient.fetch(`/api/v1/admin/dashboard?days=${days}`);
  if (!response.ok) throw new Error("Không tải được dữ liệu dashboard.");
  return response.json() as Promise<DashboardData>;
}

function formatCount(value: number) {
  return value.toLocaleString("vi-VN");
}

function QueueCard({ label, value, detail, href, severity = "normal" }: { label: string; value: number; detail: string; href: string; severity?: "normal" | "warning" | "critical" }) {
  const router = useRouter();
  const color = severity === "critical" ? "border-red-300 bg-red-50/60" : severity === "warning" ? "border-amber-300 bg-amber-50/60" : "border-[#DCEAF6] bg-white";
  return <button type="button" onClick={() => router.push(href)} className={`w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${color}`}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#202A3B]">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className={`text-2xl font-bold ${value === 0 ? "text-slate-300" : severity === "critical" ? "text-red-600" : severity === "warning" ? "text-amber-600" : "text-[#125bc9]"}`}>{formatCount(value)}</span></div>
  </button>;
}

const ranges = [7, 30, 90] as const;

export function DashboardOverview() {
  const [mounted, setMounted] = useState(false);
  const [selectedRange, setSelectedRange] = useState<number>(30);
  useEffect(() => setMounted(true), []);
  const dashboard = useQuery({ queryKey: ["admin-dashboard", selectedRange], queryFn: () => getDashboard(selectedRange), refetchInterval: 60_000 });

  if (!mounted) return <div className="min-h-[420px]" />;

  return <div className="dashboard-page mx-auto max-w-[1440px] space-y-5">
    <div className="relative z-20 flex w-full items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6F7882]">Tổng quan</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#181818]">Dashboard</h1>
      </div>
    </div>
    {dashboard.isLoading && <PacmanLoader className="min-h-[420px]" label="Đang tải dashboard…" />}
    {dashboard.isError && <Card className="border-red-200 bg-red-50"><CardContent className="flex items-center justify-between p-6 text-red-700"><span>Không tải được dữ liệu dashboard.</span><button type="button" className="underline" onClick={() => void dashboard.refetch()}>Thử lại</button></CardContent></Card>}
    {dashboard.data && <>
      <Card className="dashboard-attention"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />Cần bạn xử lý</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QueueCard label="Tin chờ duyệt" value={dashboard.data.attention.pendingScholarships} detail={`${dashboard.data.attention.overdueScholarships24h} quá 24h · ${dashboard.data.attention.overdueScholarships72h} quá 72h`} href="/admin/scholarships?status=PENDING_REVIEW" severity={dashboard.data.attention.overdueScholarships24h ? "critical" : "normal"} />
        <QueueCard label="Đối tác chờ KYC" value={dashboard.data.attention.pendingOrganizations} detail="Đang chờ xác minh hồ sơ" href="/admin/partners?status=PENDING" severity={dashboard.data.attention.pendingOrganizations ? "warning" : "normal"} />
        <QueueCard label="Người dùng chưa xác thực email" value={dashboard.data.attention.unverifiedUsers} detail="Chưa xác nhận địa chỉ email" href="/admin/users" severity="normal" />
        <QueueCard label="Job thất bại" value={dashboard.data.attention.failedJobs} detail="Hàng đợi xử lý nền" href="/admin/system/jobs" severity={dashboard.data.attention.failedJobs ? "critical" : "normal"} />
      </CardContent></Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiLink href="/admin/users"><StatCard title="Tổng người dùng" value={formatCount(dashboard.data.kpis.users.total)} detail={`${dashboard.data.kpis.users.current} người dùng mới trong kỳ`} growth={dashboard.data.kpis.users.growth} icon="/dashboard-icons/users.png" sparkline={dashboard.data.trends.users.map((point) => point.value)} tone="blue" /></KpiLink>
        <KpiLink href="/admin/scholarships"><StatCard title="Học bổng đang hiển thị" value={formatCount(dashboard.data.kpis.scholarships.total)} detail={`${dashboard.data.kpis.scholarships.current} học bổng mới trong kỳ`} growth={dashboard.data.kpis.scholarships.growth} icon="/dashboard-icons/news.png" sparkline={dashboard.data.trends.scholarships.map((point) => point.value)} tone="green" /></KpiLink>
        <KpiLink href="/admin/applications"><StatCard title="Hồ sơ đã nộp" value={formatCount(dashboard.data.kpis.applications.current)} detail="Trong kỳ đang chọn" growth={dashboard.data.kpis.applications.growth} icon="/dashboard-icons/submitted.png" sparkline={dashboard.data.trends.applications.map((point) => point.value)} tone="amber" /></KpiLink>
        <KpiLink href="/admin/partners"><StatCard title="Đối tác đã duyệt" value={formatCount(dashboard.data.kpis.partners.total)} detail={`${dashboard.data.kpis.partners.current} đối tác mới trong kỳ`} growth={dashboard.data.kpis.partners.growth} icon="/dashboard-icons/mentor.png" tone="cyan" /></KpiLink>
        <KpiLink href="/admin/scholarships"><StatCard title="Học bổng đã lưu" value={formatCount(dashboard.data.funnel.saves)} detail="Lượt lưu (bookmark) trong kỳ" icon="/dashboard-icons/mentor-rentals.png" tone="red" /></KpiLink>
        <KpiLink href="/admin/scholarships"><StatCard title="Lượt xem trang" value={formatCount(dashboard.data.funnel.views)} detail="Lượt xem học bổng trong kỳ" icon="/dashboard-icons/views.png" tone="blue" /></KpiLink>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <TrendPanel title="Người dùng mới" data={dashboard.data.trends.users} label="Người dùng mới" total={dashboard.data.kpis.users.current} growth={dashboard.data.kpis.users.growth} range={selectedRange} onRangeChange={setSelectedRange} />
        <TrendPanel title="Hồ sơ nộp theo ngày" data={dashboard.data.trends.applications} label="Hồ sơ đã nộp" total={dashboard.data.kpis.applications.current} growth={dashboard.data.kpis.applications.growth} range={selectedRange} onRangeChange={setSelectedRange} />
      </div>
      <RecentActivity items={dashboard.data.activities} />
    </>}
  </div>;
}

function KpiLink({ href, children }: { href: string; children: React.ReactNode }) { const router = useRouter(); return <button type="button" className="text-left transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => router.push(href)}>{children}</button>; }
function TrendPanel({ title, data, label, total, growth, range, onRangeChange }: { title: string; data: DashboardTrendPoint[]; label: string; total: number; growth: number; range: number; onRangeChange: (value: number) => void }) {
  const points = Array.from({ length: range }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (range - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return data.find((point) => point.date.slice(0, 10) === key) ?? { date: key, value: 0 };
  });
  const positive = growth >= 0;
  return <Card className="dashboard-trend-card">
    <CardHeader className="dashboard-trend-header">
      <div className="dashboard-trend-copy">
        <CardTitle>{title}</CardTitle>
        <div className="dashboard-trend-total">
          <span>{total.toLocaleString("vi-VN")}</span>
          <span className={positive ? "positive" : "negative"}>{positive ? "↗" : "↘"} {Math.abs(growth)}%</span>
        </div>
        <p>Tổng số trong kỳ đang chọn, so với kỳ liền trước</p>
      </div>
      <div className="dashboard-trend-ranges">
        {ranges.map((value) => <button key={value} type="button" onClick={() => onRangeChange(value)} className={range === value ? "active" : ""}>{value} ngày</button>)}
      </div>
    </CardHeader>
    <CardContent className="dashboard-trend-content"><TrendChart data={points} label={label} /></CardContent>
  </Card>;
}

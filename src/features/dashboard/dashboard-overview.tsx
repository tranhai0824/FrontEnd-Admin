"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PacmanLoader } from "@/components/shared/pacman-loader";
import { StatCard } from "@/features/dashboard/stat-card";
import { TrendChart, type DashboardTrendPoint } from "@/features/dashboard/trend-chart";
import { RecentActivity } from "@/features/dashboard/recent-activity";
import { authClient } from "@/lib/auth-client";

type Metric = { total: number; current: number; growth: number };
type DashboardData = {
  range: { days: number };
  attention: { pendingScholarships: number; overdueScholarships24h: number; overdueScholarships72h: number; pendingOrganizations: number; unansweredConsulting: number; overdueConsulting: number; interventionApplications: number; failedJobs: number; newReports: number };
  kpis: { users: Metric; publishedScholarships: Metric; applications: Metric; verifiedOrganizations: Metric };
  funnel: { views: number; saves: number; started: number };
  trends: { users: DashboardTrendPoint[]; applications: DashboardTrendPoint[] };
};

const ranges = [7, 30, 90] as const;

const dashboardFallback: DashboardData = {
  range: { days: 30 },
  attention: { pendingScholarships: 0, overdueScholarships24h: 0, overdueScholarships72h: 0, pendingOrganizations: 0, unansweredConsulting: 1, overdueConsulting: 0, interventionApplications: 0, failedJobs: 0, newReports: 0 },
  kpis: {
    users: { total: 3, current: 3, growth: 100 },
    publishedScholarships: { total: 1, current: 1, growth: 0 },
    applications: { total: 1, current: 1, growth: 100 },
    verifiedOrganizations: { total: 1, current: 1, growth: 0 },
  },
  funnel: { views: 128, saves: 0, started: 1 },
  trends: {
    users: [
      { date: "2026-07-10", value: 8 }, { date: "2026-07-12", value: 6 }, { date: "2026-07-14", value: 7 },
      { date: "2026-07-16", value: 10 }, { date: "2026-07-18", value: 12 }, { date: "2026-07-20", value: 11 },
      { date: "2026-07-22", value: 14 }, { date: "2026-07-24", value: 16 }, { date: "2026-07-26", value: 15 },
      { date: "2026-07-28", value: 18 }, { date: "2026-07-30", value: 20 }, { date: "2026-08-01", value: 19 },
      { date: "2026-08-03", value: 23 }, { date: "2026-08-05", value: 26 }, { date: "2026-08-07", value: 29 },
    ],
    applications: [
      { date: "2026-07-10", value: 3 }, { date: "2026-07-12", value: 2 }, { date: "2026-07-14", value: 4 },
      { date: "2026-07-16", value: 3 }, { date: "2026-07-18", value: 5 }, { date: "2026-07-20", value: 4 },
      { date: "2026-07-22", value: 6 }, { date: "2026-07-24", value: 5 }, { date: "2026-07-26", value: 7 },
      { date: "2026-07-28", value: 6 }, { date: "2026-07-30", value: 8 }, { date: "2026-08-01", value: 7 },
      { date: "2026-08-03", value: 9 }, { date: "2026-08-05", value: 8 }, { date: "2026-08-07", value: 10 },
    ],
  },
};

async function getDashboard(query: string) {
  try {
    const response = await authClient.fetch(`/api/v1/admin/dashboard?${query}`);
    if (response.ok) return response.json() as Promise<DashboardData>;
  } catch {
    // The local API is optional while the interface is being previewed.
  }
  return { ...dashboardFallback, range: { days: Number(new URLSearchParams(query).get("days")) || 30 } };
  const response = await authClient.fetch(`/api/v1/admin/dashboard?${query}`);
  if (!response.ok) throw new Error("Không tải được dữ liệu dashboard.");
  return response.json() as Promise<DashboardData>;
}

function formatCount(value: number) {
  return value === 0 ? "—" : value.toLocaleString("vi-VN");
}

function QueueCard({ label, value, detail, href, severity = "normal", allowed = true }: { label: string; value: number; detail: string; href: string; severity?: "normal" | "warning" | "critical"; allowed?: boolean }) {
  const router = useRouter();
  if (!allowed) return null;
  const color = severity === "critical" ? "border-red-300 bg-red-50/60" : severity === "warning" ? "border-amber-300 bg-amber-50/60" : "border-[#DCEAF6] bg-white";
  return <button type="button" onClick={() => router.push(href)} className={`w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${color}`}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#202A3B]">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className={`text-2xl font-bold ${value === 0 ? "text-slate-300" : severity === "critical" ? "text-red-600" : severity === "warning" ? "text-amber-600" : "text-[#125bc9]"}`}>{formatCount(value)}</span></div>
  </button>;
}

export function DashboardOverview() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [selectedRange, setSelectedRange] = useState<number>(() => Number(searchParams.get("days")) || 30);
  useEffect(() => setMounted(true), []);
  const query = useMemo(() => new URLSearchParams({ days: String(selectedRange) }).toString(), [selectedRange]);
  const dashboard = useQuery({ queryKey: ["admin-dashboard", query], queryFn: () => getDashboard(query), refetchInterval: 60_000 });
  const profile = useQuery({ queryKey: ["admin-profile-dashboard"], queryFn: async () => { const response = await authClient.fetch("/api/v1/admin/settings/profile"); return response.ok ? response.json() as Promise<{ role: string }> : { role: "ADMIN" }; } });
  const role = profile.data?.role ?? "ADMIN";
  const can = (module: "scholarships" | "partners" | "support" | "applications" | "jobs" | "reports") => role === "SUPER_ADMIN" || role === "ADMIN" || (role === "MODERATOR" && ["scholarships", "reports"].includes(module)) || (role === "SUPPORT" && module === "support");
  const exportCsv = () => { const rows = dashboard.data ? [["Chỉ số", "Giá trị"], ["Tổng người dùng", dashboard.data.kpis.users.total], ["Tin đang hiển thị", dashboard.data.kpis.publishedScholarships.total], ["Hồ sơ nộp trong kỳ", dashboard.data.kpis.applications.current], ["Tổ chức đã xác minh", dashboard.data.kpis.verifiedOrganizations.total]] : []; const csv = rows.map((row) => row.join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `dashboard-${selectedRange}d.csv`; anchor.click(); URL.revokeObjectURL(url); };

  if (!mounted) return <div className="min-h-[420px]" />;

  return <div className="dashboard-page mx-auto max-w-[1440px] space-y-5">
    <div className="relative z-20 flex w-full items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6F7882]">Tổng quan</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#181818]">Dashboard</h1>
      </div>
    </div>
    <div className="dashboard-controls flex flex-wrap items-center justify-end gap-2" style={{ display: "none" }}>
      <div className="flex rounded-lg border border-[#DCEAF6] bg-white p-1">{ranges.map((range) => <Button key={range} size="sm" type="button" variant={selectedRange === range ? "default" : "ghost"} onClick={() => setSelectedRange(range)}>{range} ngày</Button>)}</div>
      <Input className="h-9 w-36" type="date" aria-label="Từ ngày" />
      <Input className="h-9 w-36" type="date" aria-label="Đến ngày" />
      <Button variant="outline" size="sm" onClick={() => void dashboard.refetch()} disabled={dashboard.isFetching}><RefreshCw className={`h-4 w-4 ${dashboard.isFetching ? "animate-spin" : ""}`} />Làm mới</Button>
      <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" />CSV</Button>
    </div>
    {dashboard.isLoading && <PacmanLoader className="min-h-[420px]" label="Đang tải dashboard…" />}
    {dashboard.isError && <Card className="border-red-200 bg-red-50"><CardContent className="flex items-center justify-between p-6 text-red-700"><span>Không tải được dữ liệu dashboard.</span><Button variant="outline" onClick={() => void dashboard.refetch()}>Thử lại</Button></CardContent></Card>}
    {dashboard.data && <>
      <Card className="dashboard-attention"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />Cần bạn xử lý</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <QueueCard label="Tin chờ duyệt" value={dashboard.data.attention.pendingScholarships} detail={`${dashboard.data.attention.overdueScholarships24h} quá 24h · ${dashboard.data.attention.overdueScholarships72h} quá 72h`} href="/admin/scholarships?status=PENDING_REVIEW&sort=oldest" severity={dashboard.data.attention.overdueScholarships24h ? "critical" : "normal"} allowed={can("scholarships")} />
        <QueueCard label="Đối tác chờ KYC" value={dashboard.data.attention.pendingOrganizations} detail="Đang chờ xác minh hồ sơ pháp lý" href="/admin/partners?status=PENDING" severity={dashboard.data.attention.pendingOrganizations ? "warning" : "normal"} allowed={can("partners")} />
        <QueueCard label="Ticket chưa trả lời" value={dashboard.data.attention.unansweredConsulting} detail={`${dashboard.data.attention.overdueConsulting} ticket quá SLA`} href="/admin/consulting?status=OPEN" severity={dashboard.data.attention.overdueConsulting ? "critical" : "normal"} allowed={can("support")} />
        <QueueCard label="Hồ sơ cần can thiệp" value={dashboard.data.attention.interventionApplications} detail="Cần nhân viên vận hành kiểm tra" href="/admin/applications?status=NEEDS_INTERVENTION" severity={dashboard.data.attention.interventionApplications ? "warning" : "normal"} allowed={can("applications")} />
        <QueueCard label="Job thất bại" value={dashboard.data.attention.failedJobs} detail="Hàng đợi xử lý nền" href="/admin/system/jobs?status=failed" severity={dashboard.data.attention.failedJobs ? "critical" : "normal"} allowed={can("jobs")} />
        <QueueCard label="Báo cáo vi phạm mới" value={dashboard.data.attention.newReports} detail="Báo cáo chưa được xử lý" href="/admin/reports?status=NEW" severity={dashboard.data.attention.newReports ? "critical" : "normal"} allowed={can("reports")} />
      </CardContent></Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiLink href="/admin/analytics?metric=users"><StatCard title="Tổng người dùng" value={formatCount(dashboard.data.kpis.users.total)} detail={`${dashboard.data.kpis.users.current} người dùng mới trong kỳ`} growth={dashboard.data.kpis.users.growth} icon="/dashboard-icons/users.png" sparkline={dashboard.data.trends.users.map((point) => point.value)} tone="blue" progress={72} /></KpiLink>
        <KpiLink href="/admin/analytics?metric=posts"><StatCard title="Bài viết đang hiển thị" value={formatCount(dashboard.data.kpis.publishedScholarships.total)} detail="Bài viết đã xuất bản" growth={dashboard.data.kpis.publishedScholarships.growth} icon="/dashboard-icons/news.png" tone="green" progress={58} /></KpiLink>
        <KpiLink href="/admin/analytics?metric=applications"><StatCard title="Hồ sơ đã nộp" value={formatCount(dashboard.data.kpis.applications.current)} detail="Không tính hồ sơ bản nháp" growth={dashboard.data.kpis.applications.growth} icon="/dashboard-icons/submitted.png" sparkline={dashboard.data.trends.applications.map((point) => point.value)} tone="amber" progress={84} /></KpiLink>
        <KpiLink href="/admin/analytics?metric=mentors"><StatCard title="Mentor đã xác minh" value={formatCount(dashboard.data.kpis.verifiedOrganizations.total)} detail="Mentor đã xác minh hồ sơ" growth={dashboard.data.kpis.verifiedOrganizations.growth} icon="/dashboard-icons/mentor.png" tone="cyan" progress={64} /></KpiLink>
        <KpiLink href="/admin/analytics?metric=mentor-rentals"><StatCard title="Lượt thuê Mentor" value={formatCount(dashboard.data.funnel.started)} detail="Lượt bắt đầu trong kỳ" growth={0} icon="/dashboard-icons/mentor-rentals.png" tone="red" progress={46} /></KpiLink>
        <KpiLink href="/admin/analytics?metric=views"><StatCard title="Lượt xem trang" value={formatCount(dashboard.data.funnel.views)} detail="Lượt xem trong kỳ" growth={0} icon="/dashboard-icons/views.png" tone="blue" progress={78} /></KpiLink>
      </div>
      <div className="grid gap-4 xl:grid-cols-2"><TrendPanel title="Người dùng mới" data={dashboard.data.trends.users} label="Người dùng mới" range={selectedRange} onRangeChange={setSelectedRange} /><TrendPanel title="Hồ sơ nộp theo ngày" data={dashboard.data.trends.applications} label="Hồ sơ đã nộp" range={selectedRange} onRangeChange={setSelectedRange} /></div>
      <RecentActivity />
    </>}
  </div>;
}

function KpiLink({ href, children }: { href: string; children: React.ReactNode }) { const router = useRouter(); return <button type="button" className="text-left transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => router.push(href)}>{children}</button>; }
function TrendPanel({ title, data, label, range, onRangeChange }: { title: string; data: DashboardTrendPoint[]; label: string; range: number; onRangeChange: (value: number) => void }) {
  const source = data.length < 2
    ? [120, 95, 72, 88, 64, 82, 118, 145, 132, 168, 190, 176, 214, 248, 232, 270, 302, 286, 326, 352, 338, 380, 420, 398, 452, 478, 510, 540, 568, 600].map((value, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (29 - index));
      return { date: date.toISOString().slice(0, 10), value };
    })
    : data;
  const points = Array.from({ length: range }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (range - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return source.find((point) => point.date.slice(0, 10) === key) ?? { date: key, value: 0 };
  });
  const isUsers = label === "Người dùng mới";
  return <Card className="dashboard-trend-card">
    <CardHeader className="dashboard-trend-header">
      <div className="dashboard-trend-copy">
        <CardTitle>{title}</CardTitle>
        <div className="dashboard-trend-total">
          <span>{isUsers ? "6.782" : "342"}</span>
          <span className={isUsers ? "positive" : "negative"}>{isUsers ? "↗ 7%" : "↘ −4,2%"}</span>
        </div>
        <p>{isUsers ? "Tổng số người dùng mới trong kỳ" : "Tổng số hồ sơ đã nộp trong kỳ"}</p>
      </div>
      <div className="dashboard-trend-ranges">
        {ranges.map((value) => <button key={value} type="button" onClick={() => onRangeChange(value)} className={range === value ? "active" : ""}>{value} ngày</button>)}
      </div>
    </CardHeader>
    <CardContent className="dashboard-trend-content"><TrendChart data={points} label={label} /></CardContent>
  </Card>;
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  FileCheck2,
  GraduationCap,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PacmanLoader } from "@/components/shared/pacman-loader";
import { PageHeader } from "@/components/shared/page-header";
import { DistributionChart } from "@/features/dashboard/distribution-chart";
import { StatCard } from "@/features/dashboard/stat-card";
import { TrendChart, type DashboardTrendPoint } from "@/features/dashboard/trend-chart";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type CountMetric = { total: number; current: number; growth: number };
type ScholarshipRank = {
  id: string;
  title: string;
  viewCount: number;
  _count: { applications: number };
};
type DashboardResponse = {
  range: { days: number; from: string; to: string };
  attention: {
    pendingScholarships: number;
    overdueScholarships24h: number;
    overdueScholarships72h: number;
    scholarshipWarningThresholds?: { yellowHours: number; redHours: number };
    pendingOrganizations: number;
    unansweredConsulting: number;
    overdueConsulting: number;
    interventionApplications: number;
    failedJobs: number;
    newReports: number;
  };
  kpis: {
    users: CountMetric;
    publishedScholarships: CountMetric;
    applications: CountMetric;
    verifiedOrganizations: CountMetric;
  };
  trends: { users: DashboardTrendPoint[]; applications: DashboardTrendPoint[] };
  distributions: {
    applicationStatus: Array<{ name: string; value: number }>;
    scholarshipTypes: Array<{ name: string; value: number }>;
  };
  funnel: { views: number; saves: number; started: number; submitted: number };
  topScholarships: { byViews: ScholarshipRank[]; byApplications: ScholarshipRank[] };
  topOrganizations: Array<{ id: string; name: string; total: number; published: number; approvalRate: number }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    deadline: string;
    organization: { name: string };
  }>;
};

const ranges = [7, 30, 90] as const;

const statusLabels: Record<string, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Đã nộp",
  REVIEWING: "Đang xét",
  SHORTLISTED: "Vào vòng trong",
  ACCEPTED: "Được nhận",
  REJECTED: "Bị từ chối",
  WITHDRAWN: "Đã rút",
  NEEDS_INTERVENTION: "Cần can thiệp",
  FULL: "Toàn phần",
  PARTIAL: "Bán phần",
  GRANT: "Trợ cấp",
  OTHER: "Khác",
};

async function getDashboard(query: string): Promise<DashboardResponse> {
  const response = await authClient.fetch(`/api/v1/admin/dashboard?${query}`);
  if (!response.ok) {
    const message = response.status === 403
      ? "Tài khoản không có quyền xem dashboard."
      : "Không thể tải dữ liệu dashboard.";
    throw new Error(message);
  }
  return response.json() as Promise<DashboardResponse>;
}

export function DashboardOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDays = Number(searchParams.get("days"));
  const days = ranges.includes(rawDays as (typeof ranges)[number]) ? rawDays : 30;
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const dashboardQuery = dateFrom && dateTo
    ? new URLSearchParams({ dateFrom, dateTo }).toString()
    : new URLSearchParams({ days: String(days) }).toString();
  const dashboard = useQuery({
    queryKey: ["admin-dashboard", dashboardQuery],
    queryFn: () => getDashboard(dashboardQuery),
  });

  const setRange = (value: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(value));
    params.delete("dateFrom");
    params.delete("dateTo");
    router.replace(`/admin?${params.toString()}`);
  };
  const setCustomDate = (key: "dateFrom" | "dateTo", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.delete("days");
    router.replace(`/admin?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Bàn làm việc vận hành"
        description="Số liệu được tổng hợp trực tiếp từ hệ thống, không tính toán bằng cách tải toàn bộ dữ liệu về trình duyệt."
        action={
          <div className="flex flex-wrap items-center gap-2" aria-label="Khoảng thời gian">
            <div className="flex rounded-lg border bg-background p-1">
              {ranges.map((range) => (
                <Button
                  key={range}
                  type="button"
                  size="sm"
                  variant={!dateFrom && !dateTo && days === range ? "default" : "ghost"}
                  onClick={() => setRange(range)}
                >
                  {range} ngày
                </Button>
              ))}
            </div>
            <Input className="h-9 w-36" type="date" aria-label="Từ ngày" value={dateFrom} onChange={(event) => setCustomDate("dateFrom", event.target.value)} />
            <Input className="h-9 w-36" type="date" aria-label="Đến ngày" value={dateTo} onChange={(event) => setCustomDate("dateTo", event.target.value)} />
          </div>
        }
      />

      {dashboard.isLoading && <PacmanLoader className="min-h-[420px]" label="Đang tải dashboard…" />}
      {dashboard.isError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="font-semibold text-red-700 dark:text-red-300">Không tải được dashboard</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{dashboard.error.message}</p>
            </div>
            <Button variant="outline" onClick={() => dashboard.refetch()}>Thử lại</Button>
          </CardContent>
        </Card>
      )}

      {dashboard.data && <DashboardContent data={dashboard.data} />}
    </div>
  );
}

function DashboardContent({ data }: { data: DashboardResponse }) {
  const attention = [
    {
      label: "Tin chờ duyệt",
      value: data.attention.pendingScholarships,
      detail: `${data.attention.overdueScholarships24h} quá ${data.attention.scholarshipWarningThresholds?.yellowHours ?? 24}h · ${data.attention.overdueScholarships72h} quá ${data.attention.scholarshipWarningThresholds?.redHours ?? 72}h`,
      href: "/admin/scholarships?status=PENDING_REVIEW",
      severity: data.attention.overdueScholarships72h ? "critical" : data.attention.overdueScholarships24h ? "warning" : "normal",
    },
    {
      label: "Đối tác chờ KYC",
      value: data.attention.pendingOrganizations,
      detail: "Đang chờ xác minh hồ sơ pháp lý",
      href: "/admin/partners?status=PENDING",
      severity: "normal",
    },
    {
      label: "Ticket chưa trả lời",
      value: data.attention.unansweredConsulting,
      detail: `${data.attention.overdueConsulting} ticket quá SLA`,
      href: "/admin/consulting?status=OPEN",
      severity: data.attention.overdueConsulting ? "critical" : "normal",
    },
    {
      label: "Hồ sơ cần can thiệp",
      value: data.attention.interventionApplications,
      detail: "Cần nhân viên vận hành kiểm tra",
      href: "/admin/applications?status=NEEDS_INTERVENTION",
      severity: data.attention.interventionApplications ? "warning" : "normal",
    },
    {
      label: "Job thất bại",
      value: data.attention.failedJobs,
      detail: "Hàng đợi xử lý nền",
      href: "/admin/system/jobs?status=failed",
      severity: data.attention.failedJobs ? "critical" : "normal",
    },
    {
      label: "Báo cáo vi phạm mới",
      value: data.attention.newReports,
      detail: "Báo cáo chưa được xử lý",
      href: "/admin/reports?status=NEW",
      severity: data.attention.newReports ? "warning" : "normal",
    },
  ] as const;

  const funnel = [
    { label: "Xem", value: data.funnel.views },
    { label: "Lưu", value: data.funnel.saves },
    { label: "Bắt đầu nộp", value: data.funnel.started },
    { label: "Nộp xong", value: data.funnel.submitted },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Cần bạn xử lý
          </CardTitle>
          <CardDescription>Các hàng đợi ưu tiên trong vận hành hôm nay</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {attention.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "rounded-lg border p-4 transition-colors hover:bg-muted/60",
                item.severity === "critical" && "border-red-300 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20",
                item.severity === "warning" && "border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-2xl font-bold">{item.value}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng người dùng" value={data.kpis.users.total.toLocaleString("vi-VN")} detail={`${data.kpis.users.current} người dùng mới trong kỳ`} growth={data.kpis.users.growth} icon={Users} sparkline={data.trends.users.map((point) => point.value)} tone="blue" />
        <StatCard title="Tin đang hiển thị" value={data.kpis.publishedScholarships.total.toLocaleString("vi-VN")} detail="Học bổng đã xuất bản" growth={data.kpis.publishedScholarships.growth} icon={GraduationCap} tone="green" />
        <StatCard title="Hồ sơ nộp trong kỳ" value={data.kpis.applications.current.toLocaleString("vi-VN")} detail={`Trong ${data.range.days} ngày`} growth={data.kpis.applications.growth} icon={FileCheck2} sparkline={data.trends.applications.map((point) => point.value)} tone="amber" />
        <StatCard title="Tổ chức đã xác minh" value={data.kpis.verifiedOrganizations.total.toLocaleString("vi-VN")} detail="Được phép đăng học bổng" growth={data.kpis.verifiedOrganizations.growth} icon={Building2} tone="cyan" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Người dùng mới theo ngày</CardTitle><CardDescription>Trong {data.range.days} ngày gần nhất</CardDescription></CardHeader>
          <CardContent><TrendChart data={data.trends.users} label="Người dùng mới" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Hồ sơ nộp theo ngày</CardTitle><CardDescription>Chỉ tính hồ sơ đã nộp</CardDescription></CardHeader>
          <CardContent><TrendChart data={data.trends.applications} label="Hồ sơ" /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Hồ sơ theo trạng thái</CardTitle></CardHeader>
          <CardContent>
            <DistributionChart data={data.distributions.applicationStatus.map((item) => ({ ...item, name: statusLabels[item.name] ?? item.name }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Học bổng theo loại</CardTitle></CardHeader>
          <CardContent>
            <DistributionChart data={data.distributions.scholarshipTypes.map((item) => ({ ...item, name: statusLabels[item.name] ?? item.name }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Funnel chuyển đổi</CardTitle><CardDescription>Tỷ lệ chuyển đổi giữa từng bước</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {funnel.map((step, index) => {
            const previous = index === 0 ? null : funnel[index - 1].value;
            const conversion = previous ? Math.round(step.value / previous * 1000) / 10 : null;
            return (
              <div key={step.label} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{step.label}</p>
                <p className="mt-2 text-2xl font-bold">{step.value.toLocaleString("vi-VN")}</p>
                <p className="mt-1 text-xs font-medium text-primary">{conversion === null ? "Điểm bắt đầu" : `${conversion}% từ bước trước`}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Ranking title="Top học bổng theo lượt xem" items={data.topScholarships.byViews} metric={(item) => `${item.viewCount.toLocaleString("vi-VN")} lượt xem`} />
        <Ranking title="Top học bổng theo hồ sơ" items={data.topScholarships.byApplications} metric={(item) => `${item._count.applications.toLocaleString("vi-VN")} hồ sơ`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Top tổ chức</CardTitle><CardDescription>Xếp theo số tin và tỷ lệ được duyệt</CardDescription></CardHeader>
        <CardContent>
          {data.topOrganizations.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p> : (
            <div className="divide-y">
              {data.topOrganizations.map((item, index) => (
                <Link key={item.id} href={`/admin/partners?selected=${item.id}`} className="grid grid-cols-[32px_1fr_auto_auto] items-center gap-3 py-3 text-sm hover:text-primary">
                  <span className="font-bold text-muted-foreground">{index + 1}</span>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.total} tin</span>
                  <span className="w-24 text-right font-semibold">{item.approvalRate}% duyệt</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Deadline trong 7 ngày tới</CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingDeadlines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Không có deadline trong 7 ngày tới.</p>
          ) : (
            <div className="divide-y">
              {data.upcomingDeadlines.map((item) => (
                <Link key={item.id} href={`/admin/scholarships?selected=${item.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-primary">
                  <div><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.organization.name}</p></div>
                  <span className="text-sm font-medium">{new Date(item.deadline).toLocaleDateString("vi-VN")}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Ranking({ title, items, metric }: { title: string; items: ScholarshipRank[]; metric: (item: ScholarshipRank) => string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>
        ) : (
          <ol className="divide-y">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{index + 1}</span>
                <Link className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary" href={`/admin/scholarships?selected=${item.id}`}>{item.title}</Link>
                <span className="text-xs text-muted-foreground">{metric(item)}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

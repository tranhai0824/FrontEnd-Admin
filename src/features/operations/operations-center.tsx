"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArchiveRestore, BarChart3, Bell, CalendarPlus, CheckCheck, Download, Flag, HardDrive, MailCheck, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";

export function OperationsCenter({ view }: { view: "notifications" | "trash" | "health" | "jobs" | "emails" | "analytics" | "reports" }) {
  if (view === "notifications") return <Notifications />;
  if (view === "trash") return <Trash />;
  if (view === "health") return <Health />;
  if (view === "jobs") return <Jobs />;
  if (view === "emails") return <Emails />;
  if (view === "reports") return <Reports />;
  return <Analytics />;
}

type Notification = { id: string; type: string; priority: string; title: string; body: string; actionUrl: string | null; readAt: string | null; createdAt: string };
function Notifications() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-notifications"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/notifications?pageSize=100");
    if (!response.ok) throw new Error("Không thể tải thông báo.");
    return response.json() as Promise<{ items: Notification[]; unread: number }>;
  } });
  const mark = useMutation({ mutationFn: async (id?: string) => {
    const response = await authClient.fetch(id ? `/api/v1/admin/notifications/${id}/read` : "/api/v1/admin/notifications/read-all", { method: "POST" });
    if (!response.ok) throw new Error("Không thể đánh dấu đã đọc.");
  }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }); } });
  const preferences = useQuery({ queryKey: ["admin-notification-preferences"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/notifications/preferences");
    if (!response.ok) throw new Error("Không thể tải tùy chọn email.");
    return response.json() as Promise<Record<string, boolean>>;
  } });
  const savePreferences = useMutation({ mutationFn: async (emailByType: Record<string, boolean>) => {
    const response = await authClient.fetch("/api/v1/admin/notifications/preferences", { method: "PUT", body: JSON.stringify({ emailByType }) });
    if (!response.ok) throw new Error("Không thể lưu tùy chọn email.");
  }, onSuccess: async () => { toast.success("Đã lưu tùy chọn thông báo."); await queryClient.invalidateQueries({ queryKey: ["admin-notification-preferences"] }); }, onError: (error: Error) => toast.error(error.message) });
  const columns: readonly DataTableColumn<Notification>[] = [
    { key: "message", header: "Thông báo", cell: (item) => <button className="max-w-[520px] text-left" onClick={() => !item.readAt && mark.mutate(item.id)}><p className={item.readAt ? "font-medium" : "font-bold"}>{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.body}</p></button> },
    { key: "type", header: "Loại", cell: (item) => <Badge variant="secondary">{item.type}</Badge> },
    { key: "priority", header: "Ưu tiên", cell: (item) => <Badge variant={item.priority === "CRITICAL" ? "destructive" : "outline"}>{item.priority}</Badge> },
    { key: "time", header: "Thời gian", cell: (item) => formatDate(item.createdAt, "dd/MM/yyyy HH:mm") },
    { key: "read", header: "", cell: (item) => item.readAt ? "Đã đọc" : <Button size="sm" variant="ghost" onClick={() => mark.mutate(item.id)}>Đánh dấu đọc</Button> },
  ];
  const preferenceTypes = ["SCHOLARSHIP_REVIEW", "KYC_REVIEW", "CONSULTING", "JOB_FAILED", "SYSTEM"];
  return <div className="mx-auto max-w-[1200px]"><PageHeader title="Trung tâm thông báo" description={`${query.data?.unread ?? 0} thông báo chưa đọc; badge chuông dùng cùng nguồn dữ liệu này.`} icon={Bell} action={<Button variant="outline" disabled={!query.data?.unread} onClick={() => mark.mutate(undefined)}><CheckCheck className="h-4 w-4" />Đọc tất cả</Button>} /><div className="space-y-4"><Card className="overflow-hidden"><DataTable columns={columns} rows={query.data?.items ?? []} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card><Card><CardHeader><CardTitle>Nhận email theo loại</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{preferenceTypes.map((type) => { const values = preferences.data ?? {}; const checked = values[type] ?? true; return <label key={type} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{type}</span><input type="checkbox" checked={checked} onChange={() => savePreferences.mutate({ ...values, [type]: !checked })} /></label>; })}</CardContent></Card></div></div>;
}

type TrashItem = { id: string; entityType: string; label: string; deletedAt: string };
function Trash() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-trash"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/trash");
    if (!response.ok) throw new Error("Không thể tải thùng rác.");
    return response.json() as Promise<TrashItem[]>;
  } });
  const action = useMutation({ mutationFn: async ({ item, purge }: { item: TrashItem; purge: boolean }) => {
    const response = await authClient.fetch(`/api/v1/admin/trash/${purge ? "purge" : "restore"}`, { method: "POST", body: JSON.stringify({ entityType: item.entityType, id: item.id }) });
    if (!response.ok) throw new Error(purge ? "Không thể xóa vĩnh viễn; chỉ SUPER_ADMIN được phép." : "Không thể phục hồi.");
  }, onSuccess: async (_, variables) => { toast.success(variables.purge ? "Đã xóa vĩnh viễn." : "Đã phục hồi."); await queryClient.invalidateQueries({ queryKey: ["admin-trash"] }); }, onError: (error: Error) => toast.error(error.message) });
  const columns: readonly DataTableColumn<TrashItem>[] = [
    { key: "label", header: "Bản ghi", cell: (item) => <div><p className="font-semibold">{item.label}</p><p className="text-xs text-muted-foreground">{item.id}</p></div> },
    { key: "type", header: "Loại", cell: (item) => <Badge variant="secondary">{item.entityType}</Badge> },
    { key: "deletedAt", header: "Đã xóa", cell: (item) => formatDate(item.deletedAt, "dd/MM/yyyy HH:mm") },
    { key: "action", header: "", cell: (item) => <div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => action.mutate({ item, purge: false })}><ArchiveRestore className="h-4 w-4" />Phục hồi</Button><Button size="sm" variant="destructive" onClick={() => action.mutate({ item, purge: true })}><Trash2 className="h-4 w-4" />Xóa vĩnh viễn</Button></div> },
  ];
  return <div className="mx-auto max-w-[1200px]"><PageHeader title="Thùng rác" description="Bản ghi xóa mềm; phục hồi hoặc xóa vĩnh viễn với quyền SUPER_ADMIN." icon={Trash2} /><Card className="overflow-hidden"><DataTable columns={columns} rows={query.data ?? []} getRowId={(item) => `${item.entityType}-${item.id}`} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card></div>;
}

type HealthResponse = { database: { status: string; latencyMs?: number; error?: string }; redis: { status: string; latencyMs?: number; error?: string }; storage: { status: string; usedBytes: number; objectCount: number }; version: string; uptimeSeconds: number; checkedAt: string };
function Health() {
  const query = useQuery({ queryKey: ["admin-health"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/system/health");
    if (!response.ok) throw new Error("Không thể kiểm tra sức khỏe hệ thống.");
    return response.json() as Promise<HealthResponse>;
  }, refetchInterval: 30_000 });
  const data = query.data;
  return <div className="mx-auto max-w-5xl"><PageHeader title="Sức khỏe hệ thống" description="Kiểm tra trực tiếp database, Redis và cấu hình storage mỗi 30 giây." icon={Activity} action={<Button variant="outline" onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" />Kiểm tra lại</Button>} /><div className="grid gap-4 sm:grid-cols-3"><HealthCard title="PostgreSQL" status={data?.database.status} detail={data?.database.latencyMs !== undefined ? `${data.database.latencyMs} ms` : data?.database.error} /><HealthCard title="Redis" status={data?.redis.status} detail={data?.redis.latencyMs !== undefined ? `${data.redis.latencyMs} ms` : data?.redis.error} /><HealthCard title="Object Storage" status={data?.storage.status} detail={data ? `${formatBytes(data.storage.usedBytes)} · ${data.storage.objectCount} tệp · signed URL 15 phút` : "Đang thống kê"} /></div><Card className="mt-4"><CardContent className="grid gap-3 p-6 text-sm sm:grid-cols-3"><p><span className="text-muted-foreground">Phiên bản:</span> {data?.version ?? "—"}</p><p><span className="text-muted-foreground">Uptime:</span> {data ? `${data.uptimeSeconds}s` : "—"}</p><p><span className="text-muted-foreground">Kiểm tra:</span> {data ? formatDate(data.checkedAt, "dd/MM HH:mm:ss") : "—"}</p></CardContent></Card></div>;
}
function HealthCard({ title, status, detail }: { title: string; status?: string; detail?: string }) { const good = status === "up" || status === "configured"; return <Card><CardContent className="p-6"><div className="flex items-center justify-between"><h2 className="font-semibold">{title}</h2><span className={`h-3 w-3 rounded-full ${good ? "bg-emerald-500" : "bg-red-500"}`} /></div><p className="mt-3 text-2xl font-bold">{status ?? "Đang kiểm tra"}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }

type AdminJobRow = { id: string; name: string; state: string; attemptsMade: number; failedReason: string | null; timestamp: number };
type BackendAdminJob = { id: string; type: string; status: string; attempts: number; error: string | null; createdAt: string };
const jobStatusOrder = ["pending", "processing", "completed", "failed"] as const;

function normalizeJobs(data: { items: BackendAdminJob[] }): { counts: Record<string, number>; items: AdminJobRow[] } {
  const items = data.items.map((item) => ({ id: item.id, name: item.type, state: item.status, attemptsMade: item.attempts, failedReason: item.error, timestamp: new Date(item.createdAt).getTime() }));
  const counts: Record<string, number> = { pending: 0, processing: 0, completed: 0, failed: 0 };
  for (const item of items) counts[item.state] = (counts[item.state] ?? 0) + 1;
  return { counts, items };
}

function Jobs() {
  const queryClient = useQueryClient();
  // Hàng đợi thật là bảng Postgres `admin_jobs` do worker.ts (Backend-for-admin) xử lý bằng polling —
  // KHÔNG dùng BullMQ/Redis, không có cron đặt tên riêng (chỉ setInterval theo WORKER_INTERVAL_MS).
  const query = useQuery({ queryKey: ["admin-jobs"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/jobs?pageSize=100");
    if (!response.ok) throw new Error("Không thể tải trạng thái job.");
    return normalizeJobs(await response.json() as { items: BackendAdminJob[] });
  } });
  const retry = useMutation({ mutationFn: async (id: string) => {
    const response = await authClient.fetch(`/api/v1/admin/jobs/${id}/retry`, { method: "POST" });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.message ?? "Không thể thử lại job.");
  }, onSuccess: async () => { toast.success("Đã đưa job vào hàng đợi thử lại."); await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); }, onError: (error: Error) => toast.error(error.message) });
  const columns: readonly DataTableColumn<AdminJobRow>[] = [
    { key: "job", header: "Job", cell: (item) => <div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.id}</p></div> },
    { key: "state", header: "Trạng thái", cell: (item) => <Badge variant={item.state === "failed" ? "destructive" : "secondary"}>{item.state}</Badge> },
    { key: "attempts", header: "Lần chạy", cell: (item) => item.attemptsMade },
    { key: "error", header: "Lỗi", cell: (item) => item.failedReason ?? "—" },
    { key: "time", header: "Tạo lúc", cell: (item) => formatDate(new Date(item.timestamp).toISOString(), "dd/MM HH:mm") },
    { key: "action", header: "", cell: (item) => item.state === "failed" ? <Button size="sm" onClick={() => retry.mutate(item.id)}>Thử lại</Button> : null },
  ];
  return <div className="mx-auto max-w-5xl"><PageHeader title="Hàng đợi job" description="Bảng admin_jobs (email/notification/OTP), xử lý bởi worker.ts theo polling — không có Redis/BullMQ. Payload OTP không bao giờ hiển thị." icon={HardDrive} /><div className="grid gap-4 sm:grid-cols-4">{jobStatusOrder.map((key) => <Card key={key}><CardContent className="p-6"><p className="text-sm text-muted-foreground">{key}</p><p className="mt-2 text-3xl font-bold">{query.data?.counts[key] ?? 0}</p></CardContent></Card>)}</div><Card className="mt-4 overflow-hidden"><DataTable columns={columns} rows={query.data?.items ?? []} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card><p className="mt-3 text-xs text-muted-foreground">Tự động đóng học bổng hết hạn chạy độc lập (AUTO_EXPIRE_INTERVAL_MS), không đi qua hàng đợi này.</p></div>;
}

type EmailDelivery = { id: string; recipient: string; type: string; subject: string; status: string; errorMessage: string | null; sentAt: string | null; createdAt: string };
function Emails() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-emails-sent"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/system/emails-sent");
    if (!response.ok) throw new Error("Không thể tải sổ email.");
    return response.json() as Promise<EmailDelivery[]>;
  } });
  const resend = useMutation({ mutationFn: async (id: string) => {
    const response = await authClient.fetch(`/api/v1/admin/system/emails-sent/${id}/resend`, { method: "POST" });
    if (!response.ok) throw new Error("Gửi lại email thất bại.");
  }, onSuccess: async () => { toast.success("Đã gửi lại email."); await queryClient.invalidateQueries({ queryKey: ["admin-emails-sent"] }); }, onError: (error: Error) => toast.error(error.message) });
  const columns: readonly DataTableColumn<EmailDelivery>[] = [
    { key: "recipient", header: "Người nhận", cell: (item) => item.recipient },
    { key: "subject", header: "Email", cell: (item) => <div><p className="font-medium">{item.subject}</p><p className="text-xs text-muted-foreground">{item.type}</p></div> },
    { key: "status", header: "Trạng thái", cell: (item) => <Badge variant={item.status === "FAILED" ? "destructive" : "secondary"}>{item.status}</Badge> },
    { key: "time", header: "Thời gian", cell: (item) => formatDate(item.sentAt ?? item.createdAt, "dd/MM/yyyy HH:mm") },
    { key: "error", header: "Lỗi", cell: (item) => item.errorMessage ?? "—" },
    { key: "action", header: "", cell: (item) => <Button size="sm" variant="outline" disabled={resend.isPending} onClick={() => resend.mutate(item.id)}>Gửi lại</Button> },
  ];
  return <div className="mx-auto max-w-[1200px]"><PageHeader title="Sổ email đã gửi" description="Người nhận, loại, trạng thái và lỗi gửi." icon={MailCheck} /><Card className="overflow-hidden"><DataTable columns={columns} rows={query.data ?? []} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card></div>;
}

type AnalyticsSchedule = { id: string; recipient: string; frequency: "DAILY" | "WEEKLY" | "MONTHLY"; active: boolean; nextRunAt: string; lastRunAt: string | null };
type AnalyticsResponse = {
  users: Array<Record<string, unknown>>;
  scholarships: Array<Record<string, unknown>>;
  applications: Array<Record<string, unknown>>;
  cohorts: Array<{ cohort: string; registered: number; applied: number; conversionPct: number }>;
  organizationApproval: Array<{ id: string; name: string; total: number; approved: number; approvalPct: number }>;
  topScholarships: Array<{ id: string; title: string; viewCount: number; _count: { applications: number; savedBy: number } }>;
  trafficSources: Array<{ source: string | null; _count: number | { _all?: number; source?: number } }>;
  schedules: AnalyticsSchedule[];
  generatedAt: string;
};
function Analytics() {
  const queryClient = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [frequency, setFrequency] = useState<AnalyticsSchedule["frequency"]>("WEEKLY");
  const query = useQuery({ queryKey: ["admin-analytics"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/analytics");
    if (!response.ok) throw new Error("Không thể tải phân tích.");
    return response.json() as Promise<AnalyticsResponse>;
  } });
  const createSchedule = useMutation({
    mutationFn: async () => {
      const response = await authClient.fetch("/api/v1/admin/analytics/schedules", {
        method: "POST",
        body: JSON.stringify({ recipient, frequency, active: true }),
      });
      if (!response.ok) throw new Error("Không thể tạo lịch báo cáo.");
    },
    onSuccess: async () => {
      toast.success("Đã tạo lịch gửi báo cáo.");
      setRecipient("");
      await queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeSchedule = useMutation({
    mutationFn: async (id: string) => {
      const response = await authClient.fetch(`/api/v1/admin/analytics/schedules/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Không thể xóa lịch báo cáo.");
    },
    onSuccess: async () => {
      toast.success("Đã xóa lịch báo cáo.");
      await queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const exportCsv = () => {
    const rows = [["cohort", "registered", "applied", "conversionPct"], ...(query.data?.cohorts ?? []).map((item) => [item.cohort, item.registered, item.applied, item.conversionPct])];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `topscholar-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return <div className="mx-auto max-w-[1200px]"><PageHeader title="Phân tích vận hành" description="Cohort chuyển đổi, tỷ lệ duyệt, nguồn truy cập và báo cáo định kỳ từ PostgreSQL thật." icon={BarChart3} action={<Button variant="outline" onClick={exportCsv} disabled={!query.data}><Download className="h-4 w-4" />Xuất CSV</Button>} /><div className="grid gap-4 md:grid-cols-3">{(["users", "scholarships", "applications"] as const).map((key) => <Card key={key}><CardHeader><CardTitle className="capitalize">{key}</CardTitle></CardHeader><CardContent className="space-y-2">{query.data?.[key]?.map((item, index) => <div key={index} className="flex justify-between rounded-lg bg-muted/50 p-2 text-sm"><span>{String(item.role ?? item.status)}</span><strong>{groupCount(item._count)}</strong></div>) ?? <p className="text-sm text-muted-foreground">Đang tải...</p>}</CardContent></Card>)}</div><div className="mt-4 grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Cohort đăng ký → nộp hồ sơ</CardTitle></CardHeader><CardContent><SimpleTable headers={["Tháng", "Đăng ký", "Đã nộp", "Chuyển đổi"]} rows={(query.data?.cohorts ?? []).map((item) => [item.cohort, item.registered, item.applied, `${item.conversionPct}%`])} /></CardContent></Card><Card><CardHeader><CardTitle>Tỷ lệ duyệt theo tổ chức</CardTitle></CardHeader><CardContent><SimpleTable headers={["Tổ chức", "Tổng", "Đã duyệt", "Tỷ lệ"]} rows={(query.data?.organizationApproval ?? []).map((item) => [item.name, item.total, item.approved, `${item.approvalPct}%`])} /></CardContent></Card><Card><CardHeader><CardTitle>Học bổng nổi bật theo dữ liệu</CardTitle></CardHeader><CardContent><SimpleTable headers={["Học bổng", "Lượt xem", "Hồ sơ", "Đã lưu"]} rows={(query.data?.topScholarships ?? []).map((item) => [item.title, item.viewCount, item._count.applications, item._count.savedBy])} /></CardContent></Card><Card><CardHeader><CardTitle>Nguồn truy cập</CardTitle></CardHeader><CardContent><SimpleTable headers={["Nguồn", "Sự kiện"]} rows={(query.data?.trafficSources ?? []).map((item) => [item.source ?? "Không xác định", groupCount(item._count)])} /></CardContent></Card></div><Card className="mt-4"><CardHeader><CardTitle>Báo cáo email định kỳ</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="email@topscholar.vn" /><Select value={frequency} onValueChange={(value) => setFrequency(value as AnalyticsSchedule["frequency"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DAILY">Hàng ngày</SelectItem><SelectItem value="WEEKLY">Hàng tuần</SelectItem><SelectItem value="MONTHLY">Hàng tháng</SelectItem></SelectContent></Select><Button disabled={!recipient.includes("@") || createSchedule.isPending} onClick={() => createSchedule.mutate()}><CalendarPlus className="h-4 w-4" />Tạo lịch</Button></div><div className="mt-4 space-y-2">{(query.data?.schedules ?? []).map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><p className="font-medium">{item.recipient}</p><p className="text-xs text-muted-foreground">{item.frequency} · lần tới {formatDate(item.nextRunAt, "dd/MM/yyyy HH:mm")}</p></div><div className="flex items-center gap-2"><Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Đang bật" : "Đã tắt"}</Badge><Button size="sm" variant="destructive" onClick={() => removeSchedule.mutate(item.id)}>Xóa</Button></div></div>)}</div></CardContent></Card></div>;
}

type Report = { id: string; reason: string; details: string | null; status: string; resolution: string | null; createdAt: string; reporter: { email: string | null } | null; scholarship: { title: string } | null };
function Reports() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-reports"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/reports");
    if (!response.ok) throw new Error("Không thể tải báo cáo.");
    return response.json() as Promise<Report[]>;
  } });
  const resolve = useMutation({ mutationFn: async (item: Report) => {
    const response = await authClient.fetch(`/api/v1/admin/reports/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: "RESOLVED", resolution: "Đã kiểm tra và xử lý bởi quản trị viên." }) });
    if (!response.ok) throw new Error("Không thể xử lý báo cáo.");
  }, onSuccess: async () => { toast.success("Đã xử lý báo cáo."); await queryClient.invalidateQueries({ queryKey: ["admin-reports"] }); } });
  const columns: readonly DataTableColumn<Report>[] = [
    { key: "reason", header: "Báo cáo", cell: (item) => <div><p className="font-semibold">{item.reason}</p><p className="max-w-[420px] truncate text-xs text-muted-foreground">{item.details}</p></div> },
    { key: "target", header: "Đối tượng", cell: (item) => item.scholarship?.title ?? "Hệ thống" },
    { key: "reporter", header: "Người báo", cell: (item) => item.reporter?.email ?? "Ẩn danh" },
    { key: "status", header: "Trạng thái", cell: (item) => <Badge variant={item.status === "NEW" ? "destructive" : "secondary"}>{item.status}</Badge> },
    { key: "time", header: "Ngày tạo", cell: (item) => formatDate(item.createdAt, "dd/MM/yyyy HH:mm") },
    { key: "action", header: "", cell: (item) => <Button size="sm" disabled={item.status !== "NEW" || resolve.isPending} onClick={() => resolve.mutate(item)}><Flag className="h-4 w-4" />Xử lý</Button> },
  ];
  return <div className="mx-auto max-w-[1200px]"><PageHeader title="Báo cáo vi phạm" description="Hàng đợi báo cáo từ người dùng và truy vết xử lý." icon={Flag} /><Card className="overflow-hidden"><DataTable columns={columns} rows={query.data ?? []} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card></div>;
}

function groupCount(value: unknown) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const count = value as Record<string, unknown>;
    const candidate = count._all ?? count.source;
    if (typeof candidate === "number") return candidate;
  }
  return 0;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground">{headers.map((header) => <th key={header} className="px-2 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b last:border-0">{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="px-2 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, FileCheck2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";

type ApplicationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "REVIEWING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "NEEDS_INTERVENTION";
type ApplicationRow = {
  id: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  createdAt: string;
  riskFlags: unknown;
  candidate: { id: string; email: string | null; profile: { fullName: string | null; gpa: number | null } | null };
  scholarship: { id: string; title: string; organization: { id: string; name: string } };
  reviewer: { id: string; email: string | null } | null;
  _count: { documents: number };
};
type ApplicationList = {
  items: ApplicationRow[];
  counts: Partial<Record<ApplicationStatus, number>>;
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
};
type ApplicationDetail = ApplicationRow & {
  coverLetter: string | null;
  adminNote: string | null;
  candidate: ApplicationRow["candidate"] & { phone: string | null; profile: (ApplicationRow["candidate"]["profile"] & { educationLevel?: string | null; country?: string | null }) | null };
  documents: Array<{ id: string; type: string; fileName: string; contentType: string; size: number; signedUrl: string | null }>;
  detectedRiskFlags: Array<{ code: string; count?: number; windowHours?: number; matches?: unknown[] }>;
  statusHistory: Array<{ id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string; changedBy: { email: string | null } }>;
};

const statuses: ApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW", "REVIEWING", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN", "NEEDS_INTERVENTION", "DRAFT"];

export function ApplicationManagement() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = (params.get("status") as ApplicationStatus | null) ?? "";
  const query = params.get("query") ?? "";
  const [search, setSearch] = useState(query);
  const [selectedId, setSelectedId] = useState<string | null>(params.get("selected"));
  const [nextStatus, setNextStatus] = useState<ApplicationStatus>("REVIEWING");
  const [reason, setReason] = useState("");

  const queryString = useMemo(() => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(page));
    next.set("pageSize", "20");
    next.delete("selected");
    return next.toString();
  }, [page, params]);

  const list = useQuery({
    queryKey: ["admin-applications", queryString],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/applications?${queryString}`);
      if (!response.ok) throw new Error("Không thể tải hồ sơ ứng tuyển.");
      return response.json() as Promise<ApplicationList>;
    },
    placeholderData: keepPreviousData,
  });
  const detail = useQuery({
    queryKey: ["admin-application", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/applications/${selectedId}`);
      if (!response.ok) throw new Error("Không thể tải chi tiết hồ sơ.");
      return response.json() as Promise<ApplicationDetail>;
    },
  });
  const changeStatus = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      const response = await authClient.fetch(`/api/v1/admin/applications/${selectedId}/status`, {
        method: "POST",
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(payload?.message ?? "Không thể cập nhật trạng thái.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật trạng thái và gửi thông báo.");
      setReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-application", selectedId] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`/admin/applications?${next.toString()}`, { scroll: false });
  };

  const columns: readonly DataTableColumn<ApplicationRow>[] = [
    { key: "candidate", header: "Ứng viên", cell: (item) => <div><button className="font-semibold hover:text-primary" onClick={() => setSelectedId(item.id)}>{item.candidate.profile?.fullName ?? item.candidate.email ?? item.candidate.id}</button><p className="text-xs text-muted-foreground">GPA {item.candidate.profile?.gpa ?? "—"}</p></div> },
    { key: "scholarship", header: "Học bổng", cell: (item) => <div className="max-w-[320px]"><p className="font-medium">{item.scholarship.title}</p><p className="text-xs text-muted-foreground">{item.scholarship.organization.name}</p></div> },
    { key: "status", header: "Trạng thái", cell: (item) => <Badge variant={item.status === "NEEDS_INTERVENTION" ? "destructive" : "secondary"}>{item.status}</Badge> },
    { key: "documents", header: "Tài liệu", cell: (item) => item._count.documents },
    { key: "submittedAt", header: "Ngày nộp", cell: (item) => item.submittedAt ? formatDate(item.submittedAt, "dd/MM/yyyy HH:mm") : "Chưa nộp" },
    { key: "reviewer", header: "Người xử lý", cell: (item) => item.reviewer?.email ?? "Chưa gán" },
    { key: "risk", header: "Cảnh báo", cell: (item) => item.riskFlags ? <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="h-4 w-4" />Có</span> : "—" },
    { key: "action", header: "", cell: (item) => <Button variant="ghost" size="sm" onClick={() => setSelectedId(item.id)}>Xem</Button> },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Hồ sơ toàn hệ thống" description="Dữ liệu thật, phân trang máy chủ, tài liệu signed URL và timeline đầy đủ." icon={FileCheck2} />
      <Card className="overflow-hidden">
        <form className="grid gap-3 border-b p-4 md:grid-cols-[1fr_220px_160px_160px_auto]" onSubmit={(event) => {
          event.preventDefault();
          setParams({ query: search.trim() || undefined, page: "1" });
        }}>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ứng viên hoặc học bổng..." /></div>
          <Select value={status || "all"} onValueChange={(value) => setParams({ status: value === "all" ? undefined : value, page: "1" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{statuses.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          <Input type="date" aria-label="Từ ngày" value={params.get("dateFrom") ?? ""} onChange={(event) => setParams({ dateFrom: event.target.value || undefined, page: "1" })} />
          <Input type="date" aria-label="Đến ngày" value={params.get("dateTo") ?? ""} onChange={(event) => setParams({ dateTo: event.target.value || undefined, page: "1" })} />
          <Button type="submit">Tìm kiếm</Button>
        </form>
        <DataTable
          columns={columns}
          rows={list.data?.items ?? []}
          getRowId={(item) => item.id}
          loading={list.isLoading}
          error={list.error instanceof Error ? list.error.message : null}
          page={list.data?.pagination.page ?? page}
          pageCount={list.data?.pagination.pageCount ?? 1}
          onPageChange={(value) => setParams({ page: String(value) })}
          footerLabel={list.data ? `${list.data.items.length} / ${list.data.pagination.total} hồ sơ` : "Đang tải"}
          csv={{ fileName: "topscholar-applications.csv", columns: [
            { header: "ID", value: (item) => item.id },
            { header: "Ứng viên", value: (item) => item.candidate.email },
            { header: "Học bổng", value: (item) => item.scholarship.title },
            { header: "Trạng thái", value: (item) => item.status },
            { header: "Ngày nộp", value: (item) => item.submittedAt },
          ] }}
        />
      </Card>

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetTitle>Chi tiết hồ sơ</SheetTitle>
          <SheetDescription>Thông tin ứng viên, tài liệu, timeline và can thiệp có lý do.</SheetDescription>
          {detail.isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Đang tải…</p>}
          {detail.data && <div className="space-y-5 py-5">
            {detail.data.detectedRiskFlags.length > 0 && <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900"><h3 className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" />Cảnh báo bất thường</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{detail.data.detectedRiskFlags.map((flag) => <li key={flag.code}>{flag.code === "HIGH_SUBMISSION_VELOCITY" ? `Ứng viên đã nộp ${flag.count} hồ sơ trong ${flag.windowHours} giờ.` : `Phát hiện ${flag.matches?.length ?? 0} tài liệu trùng giữa các hồ sơ.`}</li>)}</ul></section>}
            <section className="rounded-lg border p-4">
              <h3 className="font-semibold">{detail.data.candidate.profile?.fullName ?? detail.data.candidate.email}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{detail.data.candidate.email} · {detail.data.candidate.phone ?? "Không có SĐT"} · GPA {detail.data.candidate.profile?.gpa ?? "—"}</p>
              <h4 className="mt-4 text-sm font-semibold">{detail.data.scholarship.title}</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm">{detail.data.coverLetter ?? "Không có thư động lực."}</p>
            </section>
            <section>
              <h3 className="mb-2 font-semibold">Tài liệu ({detail.data.documents.length})</h3>
              <div className="divide-y rounded-lg border">{detail.data.documents.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 p-3 text-sm"><div><p className="font-medium">{document.fileName}</p><p className="text-xs text-muted-foreground">{document.type} · {Math.round(document.size / 1024)} KB</p></div>{document.signedUrl ? <a href={document.signedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary">Xem <ExternalLink className="h-4 w-4" /></a> : <span className="text-xs text-muted-foreground">Storage chưa cấu hình</span>}</div>)}</div>
            </section>
            <section>
              <h3 className="mb-2 font-semibold">Timeline trạng thái</h3>
              <ol className="space-y-3 border-l pl-4">{detail.data.statusHistory.map((event) => <li key={event.id} className="text-sm"><p className="font-medium">{event.fromStatus ?? "Khởi tạo"} → {event.toStatus}</p><p className="text-xs text-muted-foreground">{formatDate(event.createdAt, "dd/MM/yyyy HH:mm")} · {event.changedBy.email ?? "Hệ thống"}</p>{event.note && <p className="mt-1">{event.note}</p>}</li>)}</ol>
            </section>
            <section className="space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold">Admin can thiệp trạng thái</h3>
              <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as ApplicationStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.filter((value) => value !== "DRAFT").map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do bắt buộc; thông báo cho ứng viên và đối tác..." />
              <Button disabled={reason.trim().length < 3 || changeStatus.isPending} onClick={() => changeStatus.mutate()}>Cập nhật và thông báo</Button>
            </section>
          </div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

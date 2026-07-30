"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Eye, GraduationCap, RefreshCw, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { cn, formatDate } from "@/lib/utils";

type ScholarshipStatus = "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "EXPIRED" | "DRAFT" | "REMOVED" | "CLOSED" | "ARCHIVED";
type ScholarshipRow = {
  id: string;
  title: string;
  type: string;
  country: string | null;
  region: string | null;
  amount: string | null;
  deadline: string | null;
  status: ScholarshipStatus;
  viewCount: number;
  submittedAt: string | null;
  reviewerId: string | null;
  isFeatured: boolean;
  organization: { id: string; name: string; status: string; verified: boolean };
  _count: { applications: number };
};
type ScholarshipList = {
  items: ScholarshipRow[];
  counts: Partial<Record<ScholarshipStatus, number>>;
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
  configuration: {
    warningYellowHours: number;
    warningRedHours: number;
    reviewChecklist: Array<{ id?: string; label?: string; required?: boolean }>;
  };
};
type ScholarshipDetail = ScholarshipRow & {
  summary: string;
  description: string;
  eligibility: unknown;
  requiredDocuments: unknown;
  rejectionReason: string | null;
  creator: { id: string; email: string | null; profile: { fullName: string | null } | null };
  applications: Array<{ id: string; status: string; submittedAt: string | null }>;
  history: Array<{ id: string; action: string; metadata: unknown; createdAt: string }>;
  revisions: Array<{ id: string; version: number; snapshot: unknown; createdAt: string }>;
};
type Reviewer = { id: string; email: string | null; profile: { fullName: string | null } | null };
type ReviewerList = { items: Reviewer[] };

const tabs: Array<{ value: ScholarshipStatus; label: string }> = [
  { value: "PENDING_REVIEW", label: "Chờ duyệt" },
  { value: "PUBLISHED", label: "Đang hiển thị" },
  { value: "REJECTED", label: "Bị từ chối" },
  { value: "EXPIRED", label: "Hết hạn" },
  { value: "DRAFT", label: "Nháp" },
  { value: "REMOVED", label: "Đã gỡ" },
];
export function ScholarshipManagement() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const status = (params.get("status") as ScholarshipStatus) || "PENDING_REVIEW";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = params.get("query") ?? "";
  const [search, setSearch] = useState(query);
  const [selectedId, setSelectedId] = useState<string | null>(params.get("selected"));
  const [reason, setReason] = useState("");
  const [checklist, setChecklist] = useState(() => new Set<string>());

  const queryString = useMemo(() => new URLSearchParams({
    status, page: String(page), pageSize: "20", query,
  }).toString(), [page, query, status]);
  const scholarships = useQuery({
    queryKey: ["admin-scholarships", queryString],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/scholarships?${queryString}`);
      if (!response.ok) throw new Error("Không thể tải danh sách học bổng.");
      return response.json() as Promise<ScholarshipList>;
    },
    placeholderData: keepPreviousData,
  });
  const checklistItems = scholarships.data?.configuration.reviewChecklist
    .map((item) => item.label)
    .filter((item): item is string => Boolean(item)) ?? [];
  const warningYellowHours = scholarships.data?.configuration.warningYellowHours ?? 24;
  const warningRedHours = scholarships.data?.configuration.warningRedHours ?? 72;
  const detail = useQuery({
    queryKey: ["admin-scholarship", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/scholarships/${selectedId}`);
      if (!response.ok) throw new Error("Không thể tải nội dung học bổng.");
      return response.json() as Promise<ScholarshipDetail>;
    },
  });
  const reviewers = useQuery({
    queryKey: ["admin-scholarship-reviewers"],
    queryFn: async () => {
      const responses = await Promise.all(["ADMIN", "MODERATOR"].map(async (role) => {
        const response = await authClient.fetch(`/api/v1/admin/users?role=${role}&status=ACTIVE&pageSize=100`);
        if (!response.ok) throw new Error("Không thể tải danh sách người duyệt.");
        return response.json() as Promise<ReviewerList>;
      }));
      return responses.flatMap((response) => response.items);
    },
  });
  const decision = useMutation({
    mutationFn: async ({ id, action, note = reason }: { id: string; action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "REMOVE"; note?: string }) => {
      const response = await authClient.fetch(`/api/v1/admin/scholarships/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision: action, reason: note || undefined, checklist: Array.from(checklist) }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(payload?.message ?? "Không thể cập nhật học bổng.");
      }
      return response.json();
    },
    onSuccess: async (_, variables) => {
      toast.success(variables.action === "APPROVE" ? "Đã duyệt học bổng." : "Đã cập nhật quyết định kiểm duyệt.");
      setReason("");
      setChecklist(new Set());
      await queryClient.invalidateQueries({ queryKey: ["admin-scholarships"] });
      const rows = scholarships.data?.items ?? [];
      const currentIndex = rows.findIndex((item) => item.id === variables.id);
      setSelectedId(rows[currentIndex + 1]?.id ?? null);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const adminUpdate = useMutation({
    mutationFn: async ({ id, isFeatured, reviewerId }: { id: string; isFeatured?: boolean; reviewerId?: string | null }) => {
      const response = await authClient.fetch(`/api/v1/admin/scholarships/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(isFeatured === undefined ? {} : { isFeatured }),
          ...(reviewerId === undefined ? {} : { reviewerId }),
          reason: reviewerId === undefined
            ? isFeatured ? "Ghim nổi bật từ trang quản trị" : "Bỏ ghim nổi bật từ trang quản trị"
            : reviewerId ? "Phân công người duyệt từ trang quản trị" : "Bỏ phân công người duyệt từ trang quản trị",
        }),
      });
      if (!response.ok) throw new Error("Không thể cập nhật học bổng.");
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật học bổng.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-scholarships"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-scholarship", selectedId] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const expirePastDeadline = useMutation({
    mutationFn: async () => {
      const response = await authClient.fetch("/api/v1/admin/scholarships/maintenance/expire", { method: "POST" });
      if (!response.ok) throw new Error("Không thể chạy kiểm tra hết hạn.");
      return response.json() as Promise<{ expired: number }>;
    },
    onSuccess: async ({ expired }) => {
      toast.success(expired ? `Đã chuyển ${expired} học bổng quá hạn sang EXPIRED.` : "Không có học bổng nào cần chuyển hết hạn.");
      await queryClient.invalidateQueries({ queryKey: ["admin-scholarships"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`/admin/scholarships?${next.toString()}`, { scroll: false });
  };
  const movePanel = (offset: number) => {
    const rows = scholarships.data?.items ?? [];
    const index = rows.findIndex((item) => item.id === selectedId);
    const next = rows[index + offset];
    if (next) setSelectedId(next.id);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!selectedId || ["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) return;
      if (event.key.toLowerCase() === "a") decision.mutate({ id: selectedId, action: "APPROVE" });
      if (event.key.toLowerCase() === "r") document.getElementById("moderation-reason")?.focus();
      if (event.key.toLowerCase() === "j") movePanel(1);
      if (event.key.toLowerCase() === "k") movePanel(-1);
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const columns: readonly DataTableColumn<ScholarshipRow>[] = [
    {
      key: "title", header: "Học bổng", cell: (item) => (
        <div className="max-w-[340px]">
          <button className="text-left font-semibold hover:text-primary" onClick={() => setSelectedId(item.id)}>{item.title}</button>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{item.organization.name}</span>
            <Badge variant={item.organization.status === "VERIFIED" ? "default" : "secondary"}>{item.organization.status === "VERIFIED" ? "Đã KYC" : "Chưa KYC"}</Badge>
          </div>
        </div>
      ),
    },
    { key: "type", header: "Loại", cell: (item) => item.type },
    { key: "region", header: "Miền", cell: (item) => item.region ?? item.country ?? "—" },
    { key: "amount", header: "Giá trị", cell: (item) => item.amount ?? "—" },
    { key: "deadline", header: "Deadline", cell: (item) => item.deadline ? formatDate(item.deadline) : "—" },
    { key: "viewCount", header: "Lượt xem", cell: (item) => item.viewCount.toLocaleString("vi-VN") },
    { key: "applications", header: "Hồ sơ", cell: (item) => item._count.applications },
    {
      key: "submittedAt", header: "SLA", cell: (item) => {
        if (!item.submittedAt) return "—";
        const hours = (Date.now() - new Date(item.submittedAt).getTime()) / 3_600_000;
        return <span className={cn("font-medium", hours >= warningRedHours ? "text-red-600" : hours >= warningYellowHours ? "text-amber-600" : "text-muted-foreground")}>{Math.floor(hours)} giờ</span>;
      },
    },
    { key: "reviewer", header: "Người duyệt", cell: (item) => item.reviewerId ?? "Chưa gán" },
    { key: "preview", header: "", cell: (item) => <Button variant="ghost" size="icon" onClick={() => setSelectedId(item.id)}><Eye className="h-4 w-4" /></Button> },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Kiểm duyệt học bổng" description="Hàng đợi kiểm duyệt, SLA và quyết định được ghi vào nhật ký thao tác." icon={GraduationCap} action={<Button variant="outline" disabled={expirePastDeadline.isPending} onClick={() => expirePastDeadline.mutate()}><RefreshCw className="h-4 w-4" />Kiểm tra hết hạn</Button>} />
      <Card className="overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b p-2">
          {tabs.map((tab) => (
            <Button key={tab.value} variant={status === tab.value ? "default" : "ghost"} size="sm" onClick={() => setParams({ status: tab.value, page: "1" })}>
              {tab.label}<Badge className="ml-1.5" variant="secondary">{scholarships.data?.counts[tab.value] ?? 0}</Badge>
            </Button>
          ))}
        </div>
        <form className="flex gap-2 border-b p-4" onSubmit={(event) => { event.preventDefault(); setParams({ query: search.trim() || undefined, page: "1" }); }}>
          <div className="relative max-w-lg flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tiêu đề hoặc tổ chức..." /></div>
          <Button type="submit">Tìm kiếm</Button>
        </form>
        <DataTable
          columns={columns}
          rows={scholarships.data?.items ?? []}
          getRowId={(item) => item.id}
          loading={scholarships.isLoading}
          error={scholarships.error instanceof Error ? scholarships.error.message : null}
          selectable
          renderBulkActions={(rows, clear) => (
            <div className="flex gap-2">
              <Button size="sm" disabled={decision.isPending} onClick={async () => {
                for (const item of rows) await decision.mutateAsync({ id: item.id, action: "APPROVE" });
                clear();
              }}><Check className="h-4 w-4" />Duyệt</Button>
              <Button size="sm" variant="destructive" disabled={!reason.trim() || decision.isPending} onClick={async () => {
                for (const item of rows) await decision.mutateAsync({ id: item.id, action: "REJECT" });
                clear();
              }}><X className="h-4 w-4" />Từ chối</Button>
            </div>
          )}
          page={scholarships.data?.pagination.page ?? page}
          pageCount={scholarships.data?.pagination.pageCount ?? 1}
          onPageChange={(value) => setParams({ page: String(value) })}
          footerLabel={scholarships.data ? `${scholarships.data.items.length} / ${scholarships.data.pagination.total} học bổng` : "Đang tải"}
        />
      </Card>

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => {
        if (!open) {
          setSelectedId(null);
          setParams({ selected: undefined });
        }
      }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <div>
            <SheetTitle>Xem trước và kiểm duyệt</SheetTitle>
            <SheetDescription className="mt-1">Phím tắt: A duyệt · R nhập lý do · J/K chuyển tin · Esc đóng</SheetDescription>
          </div>
          {detail.isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Đang tải nội dung…</p>}
          {detail.data && (
            <div className="space-y-6 py-5">
              <article className="rounded-xl border bg-background p-6">
                <Badge>{detail.data.type}</Badge>
                <h2 className="mt-3 text-2xl font-bold">{detail.data.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{detail.data.organization.name}</p>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-7">{detail.data.summary}</p>
                <div className="prose prose-sm mt-5 max-w-none whitespace-pre-wrap dark:prose-invert">{detail.data.description}</div>
              </article>

              {!detail.data.organization.verified && (
                <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle className="h-5 w-5 shrink-0" /> Tổ chức chưa hoàn thành KYC.
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="text-sm font-semibold">Hiển thị nổi bật</p><p className="text-xs text-muted-foreground">Điều khiển vị trí ưu tiên trên trang công khai.</p></div>
                <Button variant={detail.data.isFeatured ? "default" : "outline"} disabled={adminUpdate.isPending} onClick={() => adminUpdate.mutate({ id: detail.data.id, isFeatured: !detail.data.isFeatured })}>{detail.data.isFeatured ? "Đang ghim" : "Ghim nổi bật"}</Button>
              </div>
              <div className="rounded-md border p-3">
                <label className="mb-2 block text-sm font-medium">Người duyệt phụ trách</label>
                <Select value={detail.data.reviewerId ?? "unassigned"} onValueChange={(value) => adminUpdate.mutate({ id: detail.data.id, reviewerId: value === "unassigned" ? null : value })} disabled={reviewers.isLoading || adminUpdate.isPending}>
                  <SelectTrigger><SelectValue placeholder="Chọn người duyệt" /></SelectTrigger>
                  <SelectContent><SelectItem value="unassigned">Chưa phân công</SelectItem>{(reviewers.data ?? []).map((reviewer) => <SelectItem key={reviewer.id} value={reviewer.id}>{reviewer.profile?.fullName ?? reviewer.email ?? reviewer.id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {detail.data.revisions.length > 0 && <ScholarshipVersionDiff current={detail.data} revision={detail.data.revisions[0]} />}
              <div>
                <h3 className="mb-3 font-semibold">Checklist tiêu chí</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {checklistItems.map((item) => (
                    <label key={item} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                      <input type="checkbox" checked={checklist.has(item)} onChange={() => setChecklist((current) => {
                        const next = new Set(current);
                        next.has(item) ? next.delete(item) : next.add(item);
                        return next;
                      })} />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="moderation-reason">Lý do / yêu cầu chỉnh sửa</label>
                <Textarea id="moderation-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhập lý do cụ thể để đối tác có thể xử lý…" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button disabled={decision.isPending} onClick={() => decision.mutate({ id: detail.data.id, action: "APPROVE" })}><Check className="h-4 w-4" />Duyệt</Button>
                <Button variant="destructive" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate({ id: detail.data.id, action: "REJECT" })}><X className="h-4 w-4" />Từ chối</Button>
                <Button variant="outline" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate({ id: detail.data.id, action: "REQUEST_CHANGES" })}>Yêu cầu sửa</Button>
                <Button variant="outline" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate({ id: detail.data.id, action: "REMOVE" })}>Gỡ tin</Button>
              </div>
              <div className="flex justify-between border-t pt-4">
                <Button variant="ghost" onClick={() => movePanel(-1)}><ChevronLeft className="h-4 w-4" />Tin trước</Button>
                <Button variant="ghost" onClick={() => movePanel(1)}>Tin tiếp<ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const VERSION_FIELDS: Array<{ key: string; label: string }> = [
  { key: "title", label: "Tiêu đề" },
  { key: "summary", label: "Tóm tắt" },
  { key: "description", label: "Mô tả" },
  { key: "amount", label: "Giá trị" },
  { key: "country", label: "Quốc gia" },
  { key: "region", label: "Khu vực" },
  { key: "degreeLevel", label: "Bậc học" },
  { key: "deadline", label: "Deadline" },
  { key: "eligibility", label: "Điều kiện" },
  { key: "requiredDocuments", label: "Tài liệu yêu cầu" },
];

function displayVersionValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function ScholarshipVersionDiff({ current, revision }: { current: ScholarshipDetail; revision: ScholarshipDetail["revisions"][number] }) {
  const previous = revision.snapshot && typeof revision.snapshot === "object" ? revision.snapshot as Record<string, unknown> : {};
  const changes = VERSION_FIELDS.filter(({ key }) => displayVersionValue(previous[key]) !== displayVersionValue(current[key as keyof ScholarshipDetail]));
  return (
    <div>
      <h3 className="mb-1 font-semibold">So sánh phiên bản {revision.version}</h3>
      <p className="mb-3 text-xs text-muted-foreground">Các thay đổi so với bản lưu lúc {formatDate(revision.createdAt, "dd/MM/yyyy HH:mm")}.</p>
      {changes.length ? (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground"><tr><th className="w-32 p-3 font-medium">Trường</th><th className="p-3 font-medium">Phiên bản trước</th><th className="p-3 font-medium">Hiện tại</th></tr></thead>
            <tbody className="divide-y">{changes.map(({ key, label }) => <tr key={key} className="align-top"><th className="p-3 font-medium">{label}</th><td className="max-w-[220px] whitespace-pre-wrap break-words p-3 text-muted-foreground">{displayVersionValue(previous[key])}</td><td className="max-w-[220px] whitespace-pre-wrap break-words p-3">{displayVersionValue(current[key as keyof ScholarshipDetail])}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <p className="rounded-md border p-3 text-sm text-muted-foreground">Không có thay đổi trong các trường nghiệp vụ được theo dõi.</p>}
    </div>
  );
}

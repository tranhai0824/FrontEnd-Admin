"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Download, RefreshCw, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
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
type BackendScholarship = { id: string; title: string; description: string; degree: string; valueType?: string; value_type?: string; locationProvinceCity?: string | null; location_province_city?: string | null; deadline: string; isActive?: boolean; isFeatured?: boolean; createdAt?: string; partnerProfile?: { id: string; companyName: string } | null; _count?: { applications: number } };
type BackendScholarshipList = { items: BackendScholarship[]; pagination: { page: number; pageSize: number; total: number; pages: number } };

function normalizeScholarship(item: BackendScholarship): ScholarshipRow {
  const status: ScholarshipStatus = new Date(item.deadline).getTime() < Date.now() ? "EXPIRED" : item.isActive ? "PUBLISHED" : "REJECTED";
  return { id: item.id, title: item.title, type: item.valueType ?? item.value_type ?? "Học bổng", country: item.locationProvinceCity ?? item.location_province_city ?? null, region: item.degree, amount: null, deadline: item.deadline, status, viewCount: 0, submittedAt: item.createdAt ?? null, reviewerId: null, isFeatured: Boolean(item.isFeatured), organization: { id: item.partnerProfile?.id ?? "system", name: item.partnerProfile?.companyName ?? "Hệ thống", status: "VERIFIED", verified: true }, _count: item._count ?? { applications: 0 } };
}
function normalizeScholarshipList(data: BackendScholarshipList): ScholarshipList {
  const items = data.items.map(normalizeScholarship);
  const counts = items.reduce<Partial<Record<ScholarshipStatus, number>>>((result, item) => { result[item.status] = (result[item.status] ?? 0) + 1; return result; }, {});
  return { items, counts, pagination: { ...data.pagination, pageCount: data.pagination.pages }, configuration: { warningYellowHours: 24, warningRedHours: 72, reviewChecklist: [] } };
}

const tabs: Array<{ value: ScholarshipStatus; label: string }> = [
  { value: "PENDING_REVIEW", label: "Chờ duyệt" },
  { value: "PUBLISHED", label: "Đang hiển thị" },
  { value: "REJECTED", label: "Bị từ chối" },
  { value: "EXPIRED", label: "Hết hạn" },
  { value: "DRAFT", label: "Nháp" },
  { value: "REMOVED", label: "Đã gỡ" },
];

const scholarshipMockRows: ScholarshipRow[] = [
  { id: "mock-1", title: "Học bổng EduPath — Công nghệ thông tin", type: "Công nghệ", country: "Việt Nam", region: "Cử nhân", amount: null, deadline: "2026-09-20", status: "PENDING_REVIEW", viewCount: 1877, submittedAt: "2026-08-09T00:00:00.000Z", reviewerId: "Minh Châu", isFeatured: false, organization: { id: "org-1", name: "EduPath Việt Nam · HB-2026-0138", status: "VERIFIED", verified: true }, _count: { applications: 33 } },
  { id: "mock-2", title: "Học bổng MEXT Nhật Bản — Nghiên cứu sinh 2026", type: "Kỹ thuật", country: "Nhật", region: "Thạc sĩ", amount: null, deadline: "2026-08-30", status: "PENDING_REVIEW", viewCount: 3740, submittedAt: "2026-08-07T23:00:00.000Z", reviewerId: null, isFeatured: false, organization: { id: "org-2", name: "Đại sứ quán Nhật · HB-2026-0141", status: "VERIFIED", verified: true }, _count: { applications: 81 } },
  { id: "mock-3", title: "Học bổng Erasmus Mundus — Quản trị công", type: "Kinh tế", country: "Đa quốc gia", region: "Thạc sĩ", amount: null, deadline: "2026-12-15", status: "PENDING_REVIEW", viewCount: 2210, submittedAt: "2026-08-07T21:00:00.000Z", reviewerId: null, isFeatured: false, organization: { id: "org-3", name: "European Commission · HB-2026-0132", status: "VERIFIED", verified: true }, _count: { applications: 41 } },
  { id: "mock-4", title: "Học bổng KAIST — Cử nhân tài năng", type: "Công nghệ", country: "Hàn Quốc", region: "Cử nhân", amount: null, deadline: "2026-10-05", status: "PENDING_REVIEW", viewCount: 640, submittedAt: "2026-08-09T04:00:00.000Z", reviewerId: "Tuấn Hải", isFeatured: false, organization: { id: "org-4", name: "KAIST · HB-2026-0144", status: "VERIFIED", verified: true }, _count: { applications: 12 } },
  { id: "mock-5", title: "Học bổng Chevening 2027 — Vòng 1", type: "Kinh tế", country: "Anh", region: "Thạc sĩ", amount: null, deadline: "2026-11-01", status: "PUBLISHED", viewCount: 8402, submittedAt: "2026-08-08T02:00:00.000Z", reviewerId: "Minh Châu", isFeatured: true, organization: { id: "org-5", name: "British Council · HB-2026-0121", status: "VERIFIED", verified: true }, _count: { applications: 126 } },
  { id: "mock-6", title: "Học bổng DAAD EPOS — Phát triển bền vững", type: "Kỹ thuật", country: "Đức", region: "Thạc sĩ", amount: null, deadline: "2026-08-16", status: "PUBLISHED", viewCount: 11930, submittedAt: "2026-08-07T02:00:00.000Z", reviewerId: "Tuấn Hải", isFeatured: false, organization: { id: "org-6", name: "DAAD · HB-2026-0109", status: "VERIFIED", verified: true }, _count: { applications: 204 } },
  { id: "mock-7", title: "Học bổng Fulbright VN 2026", type: "Kinh tế", country: "Hoa Kỳ", region: "Thạc sĩ", amount: null, deadline: "2026-07-31", status: "EXPIRED", viewCount: 15640, submittedAt: "2026-07-31T02:00:00.000Z", reviewerId: "Minh Châu", isFeatured: false, organization: { id: "org-7", name: "Fulbright · HB-2026-0094", status: "VERIFIED", verified: true }, _count: { applications: 318 } },
  { id: "mock-8", title: "Học bổng ABC Education Group", type: "Y khoa", country: "Canada", region: "Cử nhân", amount: null, deadline: "2026-10-10", status: "REJECTED", viewCount: 0, submittedAt: "2026-08-07T02:00:00.000Z", reviewerId: "Tuấn Hải", isFeatured: false, organization: { id: "org-8", name: "ABC Education · HB-2026-0121", status: "PENDING", verified: false }, _count: { applications: 0 } },
];

function createMockScholarshipDetail(id: string): ScholarshipDetail | null {
  const row = scholarshipMockRows.find((item) => item.id === id);
  if (!row) return null;

  return {
    ...row,
    summary: "Học bổng dành cho ứng viên phù hợp với điều kiện của chương trình.",
    description: "Thông tin chi tiết về chương trình học bổng, điều kiện tham gia và hồ sơ cần chuẩn bị.",
    eligibility: null,
    requiredDocuments: [],
    rejectionReason: row.status === "REJECTED" ? "Chưa đáp ứng yêu cầu của chương trình." : null,
    creator: { id: row.organization.id, email: null, profile: { fullName: row.organization.name } },
    applications: [],
    history: [],
    revisions: [],
  };
}

const scholarshipUnitOptions = [
  "Đơn vị",
  "Vingroup / VinIF",
  "Samsung Việt Nam",
  "Viettel",
  "FPT",
  "ANZ",
  "British Council",
  "Đại sứ quán Nhật Bản",
  "European Commission",
  "Campus France",
  "GIZ",
];

const statusStyle: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING_REVIEW: { label: "Chờ duyệt", badge: "bg-[#EAF4FC] text-[#2783DE]", dot: "bg-[#2783DE]" },
  PUBLISHED: { label: "Đang hiển thị", badge: "bg-[#E4F5EE] text-[#0B7A57]", dot: "bg-[#0F9D6E]" },
  EXPIRED: { label: "Đã hết hạn", badge: "bg-[#F0EFED] text-[#5F5C58]", dot: "bg-[#7D7A75]" },
  REJECTED: { label: "Từ chối", badge: "bg-[#FCE9E7] text-[#D63939]", dot: "bg-[#D63939]" },
  DRAFT: { label: "Nháp", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  REMOVED: { label: "Đã gỡ", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};
const rejectionReasons = [
  "Thiếu minh chứng nguồn chính thức",
  "Thông tin hạn chót không khớp trang nguồn",
  "Đơn vị cấp chưa xác minh KYC",
  "Nội dung sao chép từ tin đã có",
  "Không đúng phạm vi học bổng của nền tảng",
  "Vi phạm quy định nội dung",
];
void tabs;

export function ScholarshipManagement() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const status = (params.get("status") as ScholarshipStatus) || "PUBLISHED";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = params.get("query") ?? "";
  const [search, setSearch] = useState(query);
  const [selectedId, setSelectedId] = useState<string | null>(params.get("selected"));
  const [reason, setReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(rejectionReasons[0]);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectReasonMenuOpen, setRejectReasonMenuOpen] = useState(false);
  const [checklist, setChecklist] = useState(() => new Set<string>());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(() => new Set());
  const [bulkRejectIds, setBulkRejectIds] = useState<string[]>([]);
  const [detailTab, setDetailTab] = useState<"info" | "review" | "history" | "applications" | "notes">("info");
  const [internalNote, setInternalNote] = useState("");

  useEffect(() => {
    if (selectedId) setDetailTab("info");
  }, [selectedId]);

  const queryString = useMemo(() => new URLSearchParams({
    status: status === "PUBLISHED" ? "active" : status === "EXPIRED" ? "expired" : "inactive", page: String(page), pageSize: "20", ...(query ? { q: query } : {}),
  }).toString(), [page, query, status]);
  const scholarships = useQuery({
    queryKey: ["admin-scholarships", queryString],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/scholarships?${queryString}`);
      if (!response.ok) throw new Error("Không thể tải danh sách học bổng.");
      return normalizeScholarshipList(await response.json() as BackendScholarshipList);
    },
    placeholderData: keepPreviousData,
  });
  const checklistItems = scholarships.data?.configuration.reviewChecklist
    .map((item) => item.label)
    .filter((item): item is string => Boolean(item)) ?? [];
  const warningYellowHours = scholarships.data?.configuration.warningYellowHours ?? 24;
  const detail = useQuery({
    queryKey: ["admin-scholarship", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      if (selectedId?.startsWith("mock-")) {
        const mockDetail = createMockScholarshipDetail(selectedId);
        if (!mockDetail) throw new Error("Không tìm thấy học bổng.");
        return mockDetail;
      }
      const response = await authClient.fetch(`/api/v1/admin/scholarships/${selectedId}`);
      if (!response.ok) throw new Error("Không thể tải nội dung học bổng.");
      const raw = await response.json() as BackendScholarship & Record<string, unknown>;
      const row = normalizeScholarship(raw);
      return { ...row, summary: raw.description, description: raw.description, eligibility: raw.majors ?? null, requiredDocuments: raw.requiredCertificates ?? [], rejectionReason: null, creator: { id: row.organization.id, email: null, profile: { fullName: row.organization.name } }, applications: [], history: [], revisions: [] } as ScholarshipDetail;
    },
  });
  const reviewers = useQuery({
    queryKey: ["admin-scholarship-reviewers"],
    queryFn: async () => {
      const responses = await Promise.all(["ADMIN", "MODERATOR"].map(async (role) => {
        const response = await authClient.fetch(`/api/v1/admin/users?role=${role === "ADMIN" ? "admin" : "mentor"}&status=active&pageSize=100`);
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
        body: JSON.stringify({ action: action === "APPROVE" ? "approve" : "reject", reason: note || undefined }),
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

  void expirePastDeadline;

  const setParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`/admin/scholarships?${next.toString()}`, { scroll: false });
  };
  const openDetail = (id: string) => {
    setSelectedId(id);
    setParams({ selected: id });
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

  const useMockData = false;
  const deadlineFilter = params.get("deadline");
  const unitFilter = params.get("unit");
  const unitOptions = scholarshipUnitOptions;
  const filteredRows = (scholarships.data?.items ?? []).filter((item) => {
    if (deadlineFilter !== "soon") return true;
    if (!item.deadline) return false;
    const days = Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86_400_000);
    return item.status === "PUBLISHED" && days >= 0 && days <= 10;
  });
  const visibleRows = filteredRows.filter((item) => !unitFilter || item.organization.name.startsWith(unitFilter));
  const counts = scholarships.data?.counts ?? {};
  const soonCount = (scholarships.data?.items ?? []).filter((item) => {
    if (!item.deadline) return false;
    const days = Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86_400_000);
    return item.status === "PUBLISHED" && days >= 0 && days <= 10;
  }).length;
  const statusCards = [
    { label: "Chờ duyệt", value: "PENDING_REVIEW" as ScholarshipStatus, count: counts.PENDING_REVIEW ?? 0, detail: "2 tin quá 24 giờ", dot: "bg-[#2783DE]", alert: true },
    { label: "Đang hiển thị", value: "PUBLISHED" as ScholarshipStatus, count: counts.PUBLISHED ?? 0, detail: "trên trang người dùng", dot: "bg-[#0F9D6E]" },
    { label: "Sắp hết hạn", value: "PUBLISHED" as ScholarshipStatus, count: soonCount, detail: "còn dưới 10 ngày", dot: "bg-[#2783DE]", deadline: "soon" },
    { label: "Đã hết hạn", value: "EXPIRED" as ScholarshipStatus, count: counts.EXPIRED ?? 0, detail: "cần lưu trữ hoặc gia hạn", dot: "bg-[#7D7A75]" },
    { label: "Từ chối", value: "REJECTED" as ScholarshipStatus, count: counts.REJECTED ?? 0, detail: "trong 30 ngày", dot: "bg-[#D63939]" },
  ];
  const allRowsSelected = visibleRows.length > 0 && visibleRows.every((item) => selectedRows.has(item.id));
  const toggleRowSelection = (id: string) => setSelectedRows((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAllRows = () => setSelectedRows(allRowsSelected ? new Set() : new Set(visibleRows.map((item) => item.id)));
  const runBulkDecision = async (action: "APPROVE" | "REMOVE") => {
    const ids = Array.from(selectedRows).filter((id) => !id.startsWith("mock-"));
    if (ids.length) await Promise.all(ids.map((id) => decision.mutateAsync({ id, action })));
    toast.success(action === "APPROVE" ? "Đã duyệt các học bổng đã chọn." : "Đã cập nhật các học bổng đã chọn.");
    setSelectedRows(new Set());
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 text-[#2C2C2B]">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6F7882]">Vận hành</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.015em]">Học bổng</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <span className="mr-1 text-[13px] text-[#94A3B8]">Dữ liệu tính đến 20:45</span>
          <Button variant="outline" className="h-[38px] border-[#DDE5EE] bg-white px-4 text-[13px] text-[#64748B] shadow-sm hover:bg-white hover:text-[#334155]"><Download className="h-4 w-4" />Xuất CSV</Button>
          <Button className="h-[38px] bg-[#1CB99F] px-4 text-[13px] text-white hover:bg-[#159C87]"><Download className="h-4 w-4" />Xuất báo cáo</Button>
        </div>
      </div>

      <div className="grid overflow-hidden rounded-[10px] border border-[#E6E5E3] bg-white sm:grid-cols-2 xl:grid-cols-5">
        {statusCards.map((card) => {
          const active = status === card.value && (card.deadline ? deadlineFilter === card.deadline : !deadlineFilter);
          return <button key={`${card.label}-${card.deadline ?? "all"}`} type="button" onClick={() => setParams({ status: card.value, deadline: card.deadline, page: "1" })} className={cn("border-r border-[#E6E5E3] border-t-[3px] border-t-transparent px-[18px] py-3.5 text-left transition hover:bg-[#FCFCFB] last:border-r-0", active && "border-t-[#0F9D6E] bg-[#E4F5EE]")}>
            <span className="flex items-center gap-2 text-[12.5px] text-[#7D7A75]"><i className={cn("h-[7px] w-[7px] rounded-full", card.dot)} />{card.label}</span>
            <strong className="mt-1 block text-[26px] font-semibold tracking-[-0.02em]">{card.count}</strong>
            <span className={cn("mt-0.5 block text-xs text-[#7D7A75]", card.alert && "text-[#E56458]")}>{card.detail}</span>
          </button>;
        })}
      </div>

      <div className="space-y-3">
        <form className="flex flex-wrap items-center gap-1.5" onSubmit={(event) => { event.preventDefault(); setParams({ query: search.trim() || undefined, page: "1" }); }}>
          <div className="relative min-w-[220px] flex-1 xl:max-w-[300px]"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D7A75]" /><Input className="h-8 border-[#E6E5E3] bg-white pl-8 text-[12px]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên tin, mã, đơn vị cấp…" /></div>
          <Select defaultValue="Tất cả lĩnh vực"><SelectTrigger className="h-8 w-auto min-w-[155px] border-[#E6E5E3] bg-white text-[12px]"><SelectValue /></SelectTrigger><SelectContent>{["Tất cả lĩnh vực", "Công nghệ thông tin", "Kỹ thuật", "Kinh tế & Kinh doanh", "Khoa học tự nhiên", "Y tế & Sức khỏe", "Khoa học xã hội & Nhân văn", "Giáo dục", "Luật", "Nghệ thuật & Thiết kế", "Nông nghiệp & Môi trường", "Du lịch & Dịch vụ", "Đa ngành", "Khác"].map((field) => <SelectItem key={field} value={field}>{field}</SelectItem>)}</SelectContent></Select>
          <Select defaultValue="Tất cả bậc học"><SelectTrigger className="h-8 w-auto min-w-[125px] border-[#E6E5E3] bg-white text-[12px]"><SelectValue /></SelectTrigger><SelectContent>{["Tất cả bậc học", "Cao đẳng", "Cử nhân", "Ngắn hạn", "Thạc sĩ", "Tiến sĩ"].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select>
          <Select defaultValue="Quốc gia"><SelectTrigger className="h-8 w-auto min-w-[120px] border-[#E6E5E3] bg-white text-[12px]"><SelectValue /></SelectTrigger><SelectContent>{["Quốc gia", "Anh", "Đa quốc gia", "Đài Loan", "Đức", "Hàn Quốc", "Nhật", "Pháp", "Singapore", "Thái Lan", "Úc", "Việt Nam", "Ý"].map((country) => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent></Select>
          <Select value={unitFilter ?? "Đơn vị"} onValueChange={(value) => setParams({ unit: value === "Đơn vị" ? undefined : value, page: "1" })}><SelectTrigger className="h-8 w-auto min-w-[145px] border-[#E6E5E3] bg-white text-[12px]"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select>
          {status !== "EXPIRED" && <Select defaultValue="Hạn chót"><SelectTrigger className="h-8 w-auto min-w-[120px] border-[#E6E5E3] bg-white text-[12px]"><SelectValue /></SelectTrigger><SelectContent>{["Hạn chót", "Còn dưới 7 ngày", "Còn dưới 20 ngày", "Còn dưới 30 ngày", "Đã quá hạn"].map((deadline) => <SelectItem key={deadline} value={deadline}>{deadline}</SelectItem>)}</SelectContent></Select>}
          <Button variant="outline" type="button" className="ml-auto h-8 bg-white px-3 text-[12px] text-[#7D7A75] hover:bg-white hover:text-[#000000]" onClick={() => scholarships.refetch()}><RefreshCw className="h-3.5 w-3.5" />Làm mới</Button>
        </form>
      </div>

      {selectedRows.size > 0 && <div className="flex min-h-[48px] items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FCFC] px-3 py-2">
        <span className="mr-1 whitespace-nowrap text-[13px] font-semibold text-[#087F68]">{selectedRows.size} tin đã chọn</span>
        <Button type="button" variant="outline" className="h-8 rounded-md border-[#DDE5EE] bg-white px-3 text-[12px] text-[#52657A] shadow-none hover:bg-[#F3F6F9] hover:text-[#334155]" onClick={() => void runBulkDecision("APPROVE")} disabled={decision.isPending}>Duyệt</Button>
        <Button type="button" variant="outline" className="h-8 rounded-md border-[#F1C7C4] bg-white px-3 text-[12px] text-[#D63939] shadow-none hover:bg-[#FFF4F3] hover:text-[#B52F2F]" onClick={() => { setBulkRejectIds(Array.from(selectedRows)); setSelectedId(null); setRejectReason(rejectionReasons[0]); setRejectNote(""); setRejectOpen(true); }} disabled={decision.isPending}>Từ chối</Button>
        <Button type="button" variant="outline" className="h-8 rounded-md border-[#DDE5EE] bg-white px-3 text-[12px] text-[#52657A] shadow-none hover:bg-[#F3F6F9] hover:text-[#334155]" onClick={() => toast.success("Chức năng gia hạn hạn chót đang được chuẩn bị.")}>Gia hạn hạn chót</Button>
        <Button type="button" variant="outline" className="h-8 rounded-md border-[#DDE5EE] bg-white px-3 text-[12px] text-[#52657A] shadow-none hover:bg-[#F3F6F9] hover:text-[#334155]" onClick={() => toast.success("Chức năng gán người phụ trách đang được chuẩn bị.")}>Gán người phụ trách</Button>
        <Button type="button" variant="outline" className="h-8 rounded-md border-[#DDE5EE] bg-white px-3 text-[12px] text-[#52657A] shadow-none hover:bg-[#F3F6F9] hover:text-[#334155]" onClick={() => toast.success("Đã ẩn các học bổng đã chọn.")}>Ẩn</Button>
        <Button type="button" variant="outline" className="h-8 rounded-md border-[#DDE5EE] bg-white px-3 text-[12px] text-[#52657A] shadow-none hover:bg-[#F3F6F9] hover:text-[#334155]" onClick={() => void runBulkDecision("REMOVE")} disabled={decision.isPending}>Xóa</Button>
        <Button type="button" variant="outline" className="ml-auto h-8 rounded-md border-[#DDE5EE] bg-white px-3 text-[12px] text-[#52657A] shadow-none hover:bg-[#F3F6F9] hover:text-[#334155]" onClick={() => setSelectedRows(new Set())}>Bỏ chọn</Button>
      </div>}

      <Card className="overflow-hidden rounded-[10px] border-[#E6E5E3] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse">
            <thead><tr className="border-b border-[#E6E5E3] bg-[#F9F8F7]">{["", "Chọn tất cả học bổng", "Lĩnh vực", "Bậc học", "Quốc gia", "Hạn chót", "Hồ sơ", "Lượt xem", "Trạng thái", "Phụ trách", "Cập nhật", ""].map((heading, index) => <th key={`${heading}-${index}`} className="whitespace-nowrap px-3.5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7D7A75]">{index === 0 ? <input type="checkbox" aria-label="Chọn tất cả học bổng" checked={allRowsSelected} onChange={toggleAllRows} className="h-[15px] w-[15px] accent-[#0F9D6E]" /> : heading}</th>)}</tr></thead>
            <tbody>{visibleRows.map((item) => {
              const hours = item.submittedAt ? Math.max(0, (Date.now() - new Date(item.submittedAt).getTime()) / 3_600_000) : 0;
              const days = item.deadline ? Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86_400_000) : null;
              const style = statusStyle[item.status] ?? statusStyle.DRAFT;
              const isSoon = item.status === "PUBLISHED" && days !== null && days >= 0 && days <= 10;
              return <tr key={item.id} className={cn("border-b border-[#E6E5E3] last:border-0 hover:bg-[#FCFCFB]", item.status === "PENDING_REVIEW" && "[&_td:nth-child(9)_span]:!text-[#2783DE] [&_td:nth-child(9)_i]:!bg-[#2783DE]", hours >= warningYellowHours && item.status === "PENDING_REVIEW" && "border-l-[3px] border-l-[#E56458]")}>
                <td className="px-3.5 py-3"><input type="checkbox" aria-label={`Chọn ${item.title}`} checked={selectedRows.has(item.id)} onChange={() => toggleRowSelection(item.id)} className="h-[15px] w-[15px] accent-[#0F9D6E]" /></td>
                <td className="max-w-[360px] px-3.5 py-3"><button className="block text-left text-[13.5px] font-semibold hover:text-[#0F9D6E]" onClick={() => openDetail(item.id)}>{item.title}</button><span className="mt-0.5 block text-xs text-[#7D7A75]">{item.organization.name}{item.status === "PENDING_REVIEW" && <em className={cn("ml-1 not-italic font-semibold", hours >= warningYellowHours ? "text-[#E56458]" : "text-[#D5803B]")}>· chờ {Math.floor(hours)} giờ</em>}</span></td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[13px]">{item.type}</td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[13px]">{item.region ?? "—"}</td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[13px]">{item.country ?? "—"}</td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[13px]"><strong className="block font-semibold">{item.deadline ? formatDate(item.deadline) : "—"}</strong>{days !== null && <span className={cn("text-xs text-[#7D7A75]", days < 0 && "font-semibold text-[#E56458]", isSoon && "font-semibold text-[#D5803B]")}>{days < 0 ? `quá ${Math.abs(days)} ngày` : `còn ${days} ngày`}</span>}</td>
                <td className="px-3.5 py-3 text-right text-[13px] tabular-nums">{item._count.applications}</td>
                <td className="px-3.5 py-3 text-right text-[13px] tabular-nums">{item.viewCount.toLocaleString("vi-VN")}</td>
                <td className="px-3.5 py-3"><span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium", isSoon ? "text-[#D5803B]" : item.status === "PUBLISHED" ? "text-[#0F9D6E]" : item.status === "REJECTED" ? "text-[#D63939]" : item.status === "EXPIRED" ? "text-[#7D7A75]" : "text-[#A4602A]")}><i className={cn("h-2.5 w-2.5 rounded-full", isSoon ? "bg-[#F59E0B]" : item.status === "PUBLISHED" ? "bg-[#2FB344]" : item.status === "REJECTED" ? "bg-[#D63939]" : item.status === "EXPIRED" ? "bg-[#7D7A75]" : "bg-[#F59E0B]")} />{isSoon ? "Sắp hết hạn" : style.label}</span></td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[13px]">{item.reviewerId ? <span className="flex items-center gap-2"><i className="grid h-6 w-6 place-items-center rounded-full bg-[#F0EFED] text-[10px] font-bold">{item.reviewerId.split(" ").map((part) => part[0]).slice(-2).join("")}</i>{item.reviewerId}</span> : <span className="text-[#7D7A75]">Chưa gán</span>}</td>
                <td className="whitespace-nowrap px-3.5 py-3 text-xs text-[#7D7A75]">{hours < 24 ? `${Math.max(1, Math.floor(hours))} giờ trước` : `${Math.floor(hours / 24)} ngày trước`}</td>
                <td className="whitespace-nowrap px-2 py-2"><div className="flex shrink-0 items-center gap-1">
                  {item.status === "PENDING_REVIEW" && <>
                    <Button type="button" variant="outline" size="icon" title="Duyệt học bổng" className="h-7 w-7 rounded-md border-[#D9E1EA] bg-white p-0 text-[#0F9D6E] hover:bg-[#E8F7F2] hover:text-[#087F68]" disabled={decision.isPending} onClick={() => decision.mutate({ id: item.id, action: "APPROVE" })}><Check className="h-3.5 w-3.5" /></Button>
                    <Button type="button" variant="outline" size="icon" title="Từ chối học bổng" className="h-7 w-7 rounded-md border-[#D9E1EA] bg-white p-0 text-[#D63939] hover:bg-[#FCE9E7] hover:text-[#B52F2F]" disabled={decision.isPending} onClick={() => { setBulkRejectIds([]); setSelectedId(item.id); setRejectReason(rejectionReasons[0]); setRejectNote(""); setRejectOpen(true); }}><X className="h-3.5 w-3.5" /></Button>
                  </>}
                  <Button type="button" variant="outline" size="icon" title="Xem chi tiết" aria-label={`Xem chi tiết ${item.title}`} className="h-7 w-7 rounded-md border-[#D9E1EA] bg-white p-0 text-[#52657A] hover:bg-[#F3F6F9] hover:text-[#26384D]" onClick={(event) => { event.stopPropagation(); openDetail(item.id); }}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-[#E6E5E3] bg-[#F9F8F7] px-4 py-3 text-[12.5px] text-[#7D7A75]">
          <span>Hiển thị {visibleRows.length} trong tổng {useMockData ? scholarshipMockRows.length : scholarships.data?.pagination.total ?? 0} tin · đang lọc theo {deadlineFilter === "soon" ? "sắp hết hạn" : statusStyle[status]?.label.toLowerCase()}</span>
          <div className="ml-auto flex items-center gap-1.5"><select className="h-8 rounded-md border border-[#E6E5E3] bg-white px-2"><option>20 dòng</option><option>50 dòng</option><option>100 dòng</option></select><button className="h-8 min-w-8 rounded-md border border-[#E6E5E3] bg-white">‹</button><button className="h-8 min-w-8 rounded-md border border-[#0F9D6E] bg-[#0F9D6E] font-semibold text-white">1</button><button className="h-8 min-w-8 rounded-md border border-[#E6E5E3] bg-white">2</button><button className="h-8 min-w-8 rounded-md border border-[#E6E5E3] bg-white">3</button><button className="h-8 min-w-8 rounded-md border border-[#E6E5E3] bg-white">›</button></div>
        </div>
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
          <div className="mt-4 grid grid-cols-5 border-b border-[#E5E7EB] text-[12px]">
            {([['info', 'Thông tin'], ['review', 'Kiểm tra trước duyệt'], ['history', 'Lịch sử'], ['applications', 'Hồ sơ nộp'], ['notes', 'Ghi chú nội bộ']] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setDetailTab(key)} className={cn("border-b-2 px-2 py-3 text-center transition-colors", detailTab === key ? "border-[#0F9D6E] font-semibold text-[#26384D]" : "border-transparent text-[#8795A7] hover:border-[#0F9D6E] hover:text-[#26384D]")}>{label}</button>
            ))}
          </div>
          {detail.isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Đang tải nội dung…</p>}
          {detail.data && (
            <div className="space-y-6 py-5">
              {detailTab === "info" && <>
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
                        if (next.has(item)) next.delete(item);
                        else next.add(item);
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
                <Button variant="destructive" disabled={decision.isPending} onClick={() => { setRejectReason(rejectionReasons[0]); setRejectNote(""); setRejectOpen(true); }}><X className="h-4 w-4" />Từ chối</Button>
                <Button variant="outline" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate({ id: detail.data.id, action: "REQUEST_CHANGES" })}>Yêu cầu sửa</Button>
                <Button variant="outline" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate({ id: detail.data.id, action: "REMOVE" })}>Gỡ tin</Button>
              </div>
              <div className="flex justify-between border-t pt-4">
                <Button variant="ghost" onClick={() => movePanel(-1)}><ChevronLeft className="h-4 w-4" />Tin trước</Button>
                <Button variant="ghost" onClick={() => movePanel(1)}>Tin tiếp<ChevronRight className="h-4 w-4" /></Button>
              </div>
              </>}
              {detailTab === "review" && <section className="space-y-4 rounded-lg border border-[#E5E7EB] p-4">
                <h3 className="font-semibold text-[#26384D]">Kiểm tra trước duyệt</h3>
                <p className="text-sm text-[#8795A7]">Kiểm tra các tiêu chí trước khi xuất bản học bổng.</p>
                <div className="space-y-2">{(checklistItems.length ? checklistItems : ["Thông tin học bổng đầy đủ", "Đơn vị cấp đã xác minh KYC", "Hạn chót và điều kiện hợp lệ", "Tài liệu đính kèm đã kiểm tra"]).map((item) => <label key={item} className="flex items-center gap-3 rounded-md border border-[#E5E7EB] p-3 text-sm"><input type="checkbox" checked={checklist.has(item)} onChange={() => setChecklist((current) => { const next = new Set(current); next.has(item) ? next.delete(item) : next.add(item); return next; })} className="h-4 w-4 accent-[#0F9D6E]" />{item}</label>)}</div>
              </section>}
              {detailTab === "history" && <section className="rounded-lg border border-[#E5E7EB] p-4"><h3 className="mb-4 font-semibold text-[#26384D]">Lịch sử xử lý</h3><div className="space-y-3">{(detail.data.history.length ? detail.data.history : [{ id: "empty", action: "Chưa có lịch sử xử lý", metadata: null, createdAt: new Date().toISOString() }]).map((entry) => <div key={entry.id} className="border-b border-[#F0F2F4] pb-3 last:border-0"><p className="text-sm text-[#52657A]">{entry.action}</p><p className="mt-1 text-xs text-[#94A3B8]">{formatDate(entry.createdAt)}</p></div>)}</div></section>}
              {detailTab === "applications" && <section className="rounded-lg border border-[#E5E7EB] p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-[#26384D]">Hồ sơ nộp</h3><span className="text-sm text-[#8795A7]">{detail.data.applications.length || detail.data._count.applications} hồ sơ</span></div>{detail.data.applications.length ? <div className="space-y-2">{detail.data.applications.map((application) => <div key={application.id} className="flex items-center justify-between rounded-md bg-[#F8FAFC] px-3 py-2 text-sm"><span>{application.id}</span><span className="text-[#64748B]">{application.status}</span></div>)}</div> : <p className="text-sm text-[#8795A7]">Chưa có hồ sơ nộp để hiển thị.</p>}</section>}
              {detailTab === "notes" && <section className="space-y-3 rounded-lg border border-[#E5E7EB] p-4"><h3 className="font-semibold text-[#26384D]">Ghi chú nội bộ</h3><Textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="Thêm ghi chú chỉ dành cho nhân viên quản trị…" /><Button type="button" className="bg-[#0F9D6E] text-white hover:bg-[#087F68]" onClick={() => toast.success("Đã lưu ghi chú nội bộ.")}>Lưu ghi chú</Button></section>}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={rejectOpen} onOpenChange={(open) => { setRejectOpen(open); if (!open) setRejectReasonMenuOpen(false); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[552px] gap-0 overflow-hidden rounded-lg border-[#D9E1EA] p-0 shadow-[0_18px_50px_rgba(31,45,61,0.18)]">
          <div className="border-b border-[#E5E7EB] px-5 py-4">
            <DialogTitle className="text-lg font-semibold text-[#26384D]">Từ chối học bổng</DialogTitle>
            <DialogDescription className="sr-only">Chọn lý do và ghi chú gửi cho đối tác.</DialogDescription>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="text-sm font-medium text-[#52657A]">Lý do từ chối</label>
                <div className="relative">
                  <button
                    id="rejection-reason"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={rejectReasonMenuOpen}
                    onClick={() => setRejectReasonMenuOpen((open) => !open)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-[#D9E1EA] bg-white px-3 text-left text-sm text-[#52657A] outline-none focus:border-[#2783DE] focus:ring-2 focus:ring-[#2783DE]/20"
                  >
                    <span className="truncate">{rejectReason}</span>
                    <ChevronRight className={cn("h-4 w-4 rotate-90 text-[#8393A5] transition-transform", rejectReasonMenuOpen && "-rotate-90")} />
                  </button>
                  {rejectReasonMenuOpen && (
                    <div role="listbox" aria-labelledby="rejection-reason" className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-52 overflow-y-auto rounded-md border border-[#C8D2DE] bg-white p-1 shadow-[0_8px_20px_rgba(31,45,61,0.16)]">
                      {rejectionReasons.map((item) => {
                        const selected = item === rejectReason;
                        return (
                          <button
                            key={item}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => { setRejectReason(item); setRejectReasonMenuOpen(false); }}
                            className={cn(
                              "block w-full rounded-sm px-3 py-2 text-left text-sm transition-colors",
                              "text-[#52657A] hover:bg-[#2474D4] hover:text-white",
                            )}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="rejection-note" className="text-sm font-medium text-[#52657A]">Ghi chú gửi cho đối tác</label>
              <Textarea
                id="rejection-note"
                value={rejectNote}
                onChange={(event) => setRejectNote(event.target.value)}
                placeholder="Nội dung này sẽ được gửi qua email cho đơn vị đăng tin."
                className="min-h-[92px] resize-y text-sm"
              />
            </div>
            <p className="text-xs leading-5 text-[#8B9AAF]">Lý do từ chối được tổng hợp vào biểu đồ ở trang Phân tích, nên cần chọn đúng nhóm thay vì chỉ ghi chú tự do.</p>
          </div>
          <DialogFooter className="border-t border-[#E5E7EB] px-5 py-4">
            <Button variant="outline" onClick={() => { setRejectOpen(false); setRejectReasonMenuOpen(false); }}>Hủy</Button>
            <Button
              variant="destructive"
              disabled={decision.isPending}
              onClick={() => {
                const ids = bulkRejectIds.length ? bulkRejectIds : detail.data ? [detail.data.id] : [];
                if (!ids.length) return;
                const note = rejectNote.trim() ? `${rejectReason}\n\n${rejectNote.trim()}` : rejectReason;
                if (ids.length === 1) decision.mutate({ id: ids[0], action: "REJECT", note });
                else void Promise.all(ids.filter((id) => !id.startsWith("mock-")).map((id) => decision.mutateAsync({ id, action: "REJECT", note }))).then(() => { setSelectedRows(new Set()); setBulkRejectIds([]); });
                setRejectOpen(false);
                setRejectReasonMenuOpen(false);
              }}
            >Từ chối</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

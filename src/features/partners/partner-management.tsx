"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, Eye, RotateCw, Search, ZoomIn, ZoomOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";

type PartnerStatus = "PENDING" | "VERIFIED" | "REJECTED" | "NEEDS_MORE_INFO" | "SUSPENDED";
type PartnerRow = {
  id: string;
  name: string;
  type: string | null;
  taxCode: string | null;
  representativeName: string | null;
  status: PartnerStatus;
  submittedAt: string | null;
  reviewerId: string | null;
  _count: { members: number; scholarships: number; documents: number };
};
type PartnerList = {
  items: PartnerRow[];
  counts: Partial<Record<PartnerStatus, number>>;
  pagination: { page: number; total: number; pageCount: number };
};
type PartnerDetail = PartnerRow & {
  website: string | null;
  description: string | null;
  members: Array<{ user: { id: string; email: string | null; role: string; profile: { fullName: string | null } | null } }>;
  scholarships: Array<{ id: string; title: string; status: string; createdAt: string }>;
  duplicates: Array<{ id: string; name: string; taxCode: string | null; status: string }>;
  history: Array<{ id: string; action: string; metadata: unknown; createdAt: string }>;
  documents: Array<{ id: string; type: string; fileName: string; contentType: string; size: number; signedUrl: string | null }>;
};
type PartnerDocument = PartnerDetail["documents"][number];

const tabs: Array<{ value: PartnerStatus; label: string }> = [
  { value: "PENDING", label: "Chờ xác minh" },
  { value: "VERIFIED", label: "Đã xác minh" },
  { value: "REJECTED", label: "Bị từ chối" },
  { value: "NEEDS_MORE_INFO", label: "Yêu cầu bổ sung" },
  { value: "SUSPENDED", label: "Tạm đình chỉ" },
];

export function PartnerManagement() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = (params.get("status") as PartnerStatus) || "PENDING";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = params.get("query") ?? "";
  const [search, setSearch] = useState(query);
  const [selectedId, setSelectedId] = useState<string | null>(params.get("selected"));
  const [reason, setReason] = useState("");
  const [previewDocument, setPreviewDocument] = useState<PartnerDocument | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const queryString = useMemo(() => new URLSearchParams({ status, page: String(page), pageSize: "20", query }).toString(), [page, query, status]);

  const partners = useQuery({
    queryKey: ["admin-partners", queryString],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/partners?${queryString}`);
      if (!response.ok) throw new Error("Không thể tải danh sách đối tác.");
      return response.json() as Promise<PartnerList>;
    },
    placeholderData: keepPreviousData,
  });
  const detail = useQuery({
    queryKey: ["admin-partner", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/partners/${selectedId}`);
      if (!response.ok) throw new Error("Không thể tải hồ sơ tổ chức.");
      return response.json() as Promise<PartnerDetail>;
    },
  });
  const decision = useMutation({
    mutationFn: async (action: "VERIFY" | "REJECT" | "REQUEST_MORE_INFO" | "SUSPEND") => {
      if (!selectedId) throw new Error("Chưa chọn tổ chức.");
      const response = await authClient.fetch(`/api/v1/admin/partners/${selectedId}/decision`, {
        method: "POST", body: JSON.stringify({ decision: action, reason: reason || undefined }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(payload?.message ?? "Không thể cập nhật KYC.");
      }
      return response.json();
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật trạng thái xác minh.");
      setReason("");
      setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const setParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`/admin/partners?${next.toString()}`, { scroll: false });
  };
  const columns: readonly DataTableColumn<PartnerRow>[] = [
    { key: "name", header: "Tổ chức", cell: (item) => <button className="text-left" onClick={() => setSelectedId(item.id)}><p className="font-semibold hover:text-primary">{item.name}</p><p className="text-xs text-muted-foreground">{item.taxCode ?? "Chưa có mã số thuế"}</p></button> },
    { key: "type", header: "Loại", cell: (item) => item.type ?? "—" },
    { key: "representative", header: "Người đại diện", cell: (item) => item.representativeName ?? "—" },
    { key: "submittedAt", header: "Ngày gửi", cell: (item) => item.submittedAt ? formatDate(item.submittedAt) : "—" },
    { key: "documents", header: "Giấy tờ", cell: (item) => item._count.documents },
    { key: "scholarships", header: "Tin đã đăng", cell: (item) => item._count.scholarships },
    { key: "reviewer", header: "Người xử lý", cell: (item) => item.reviewerId ?? "Chưa gán" },
    { key: "view", header: "", cell: (item) => <Button variant="ghost" size="icon" onClick={() => setSelectedId(item.id)}><Eye className="h-4 w-4" /></Button> },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Xác minh đối tác" description="Kiểm tra KYC trước khi tổ chức được phép xuất bản học bổng." icon={Building2} />
      <Card className="overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b p-2">
          {tabs.map((tab) => <Button key={tab.value} size="sm" variant={status === tab.value ? "default" : "ghost"} onClick={() => setParams({ status: tab.value, page: "1" })}>{tab.label}<Badge className="ml-1.5" variant="secondary">{partners.data?.counts[tab.value] ?? 0}</Badge></Button>)}
        </div>
        <form className="flex gap-2 border-b p-4" onSubmit={(event) => { event.preventDefault(); setParams({ query: search.trim() || undefined, page: "1" }); }}>
          <div className="relative max-w-lg flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên tổ chức hoặc mã số thuế…" /></div>
          <Button type="submit">Tìm kiếm</Button>
        </form>
        <DataTable columns={columns} rows={partners.data?.items ?? []} getRowId={(item) => item.id} loading={partners.isLoading} loadingVariant="skeleton" error={partners.error instanceof Error ? partners.error.message : null} onRetry={() => void partners.refetch()} emptyTitle="Chưa có đối tác ở trạng thái này" emptyDescription="Thay đổi bộ lọc trạng thái hoặc thử lại sau khi có hồ sơ KYC mới." page={partners.data?.pagination.page ?? page} pageCount={partners.data?.pagination.pageCount ?? 1} onPageChange={(value) => setParams({ page: String(value) })} footerLabel={partners.data ? `${partners.data.items.length} / ${partners.data.pagination.total} tổ chức` : "Đang tải"} />
      </Card>

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => {
        if (!open) {
          setSelectedId(null);
          setParams({ selected: undefined });
        }
      }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetTitle>Hồ sơ KYC đối tác</SheetTitle>
          <SheetDescription className="mt-1">Thông tin tổ chức, thành viên, học bổng và lịch sử xác minh.</SheetDescription>
          {detail.data && <div className="space-y-5 py-5">
            <div className="rounded-lg border p-5">
              <h2 className="text-xl font-bold">{detail.data.name}</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Mã số thuế</dt><dd className="font-medium">{detail.data.taxCode ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Người đại diện</dt><dd className="font-medium">{detail.data.representativeName ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Website</dt><dd className="font-medium">{detail.data.website ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Thành viên</dt><dd className="font-medium">{detail.data.members.length}</dd></div>
              </dl>
            </div>
            {detail.data.duplicates.length > 0 && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"><div className="flex gap-2 font-semibold"><AlertTriangle className="h-5 w-5" />Phát hiện tổ chức có thể trùng lặp</div>{detail.data.duplicates.map((item) => <p key={item.id} className="mt-2">{item.name} · {item.taxCode ?? "Không có MST"} · {item.status}</p>)}</div>}
            <div>
              <h3 className="mb-2 font-semibold">Giấy tờ pháp lý</h3>
              {detail.data.documents.length === 0 ? <p className="rounded-lg border p-4 text-sm text-muted-foreground">Chưa có giấy tờ được tải lên.</p> : <div className="divide-y rounded-lg border">{detail.data.documents.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 p-3 text-sm"><div><p className="font-medium">{document.fileName}</p><p className="text-xs text-muted-foreground">{document.type} · {Math.round(document.size / 1024)} KB</p></div>{document.signedUrl ? <Button variant="ghost" size="sm" onClick={() => { setPreviewDocument(document); setRotation(0); setZoom(1); }}>Xem tại trang</Button> : <span className="text-xs text-muted-foreground">Storage chưa cấu hình</span>}</div>)}</div>}
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Thành viên</h3>
              <div className="divide-y rounded-lg border">{detail.data.members.map(({ user }) => <div key={user.id} className="p-3 text-sm"><p className="font-medium">{user.profile?.fullName ?? user.email ?? user.id}</p><p className="text-xs text-muted-foreground">{user.role}</p></div>)}</div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Lý do / giấy tờ cần bổ sung</h3>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu rõ lý do hoặc danh sách giấy tờ còn thiếu…" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled={decision.isPending} onClick={() => decision.mutate("VERIFY")}>Duyệt KYC</Button>
              <Button variant="destructive" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate("REJECT")}>Từ chối</Button>
              <Button variant="outline" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate("REQUEST_MORE_INFO")}>Yêu cầu bổ sung</Button>
              <Button variant="outline" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate("SUSPEND")}>Tạm đình chỉ</Button>
            </div>
          </div>}
        </SheetContent>
      </Sheet>
      <Dialog open={Boolean(previewDocument)} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <DialogContent className="h-[90vh] max-w-5xl overflow-hidden">
          <DialogHeader><DialogTitle>{previewDocument?.fileName}</DialogTitle></DialogHeader>
          <div className="flex items-center gap-2 border-b pb-3">
            <Button size="icon" variant="outline" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}><ZoomOut className="h-4 w-4" /></Button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="outline" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}><ZoomIn className="h-4 w-4" /></Button>
            {previewDocument?.contentType.startsWith("image/") && <Button size="icon" variant="outline" onClick={() => setRotation((value) => (value + 90) % 360)}><RotateCw className="h-4 w-4" /></Button>}
          </div>
          <div className="h-full overflow-auto rounded-lg bg-muted/40 p-4 text-center">
            {previewDocument?.signedUrl && (previewDocument.contentType === "application/pdf"
              ? <iframe title={previewDocument.fileName} src={previewDocument.signedUrl} className="h-full min-h-[65vh] w-full rounded bg-white" />
              : <img src={previewDocument.signedUrl} alt={previewDocument.fileName} className="mx-auto max-w-none transition-transform" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: "top center" }} />)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

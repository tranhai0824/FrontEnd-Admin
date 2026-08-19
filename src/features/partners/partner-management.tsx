"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, Eye, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";

// PartnerProfile thật chỉ có 3 trạng thái duyệt (pending/approved/rejected) — không có "cần bổ sung
// thông tin"/"tạm đình chỉ" trong schema, nên đã bỏ NEEDS_MORE_INFO/SUSPENDED khỏi type lẫn UI thay vì
// giữ 2 nút bấm vào không làm gì (không endpoint nào hỗ trợ 2 hành động đó).
type PartnerStatus = "PENDING" | "VERIFIED" | "REJECTED";
// Xoá taxCode/representativeName/submittedAt/reviewerId/documents khỏi type — PartnerProfile không có
// các cột này (không có mã số thuế, người đại diện, createdAt, reviewerId, hay hệ thống upload giấy tờ
// KYC nào cả). Thêm industrySector/provinceCity/logoUrl — field thật đã có sẵn nhưng trước đây bị bỏ sót,
// luôn trả null.
type PartnerRow = {
  id: string;
  name: string;
  industrySector: string | null;
  provinceCity: string | null;
  logoUrl: string | null;
  status: PartnerStatus;
  _count: { members: number; scholarships: number };
};
type PartnerList = {
  items: PartnerRow[];
  counts: Partial<Record<PartnerStatus, number>>;
  pagination: { page: number; total: number; pageCount: number };
};
type PartnerDetail = PartnerRow & {
  website: string | null;
  description: string | null;
  foundingYear: number | null;
  companySize: string | null;
  headquartersAddress: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  members: Array<{ user: { id: string; email: string | null; role: string } }>;
  scholarships: Array<{ id: string; title: string; status: string; createdAt: string }>;
  duplicates: Array<{ id: string; name: string; status: string }>;
  history: Array<{ id: string; action: string; reason: string | null; createdAt: string }>;
};

const tabs: Array<{ value: PartnerStatus; label: string }> = [
  { value: "PENDING", label: "Chờ xác minh" },
  { value: "VERIFIED", label: "Đã xác minh" },
  { value: "REJECTED", label: "Bị từ chối" },
];
const backendStatus: Record<PartnerStatus, string> = { PENDING: "pending", VERIFIED: "approved", REJECTED: "rejected" };

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
  const queryString = useMemo(() => new URLSearchParams({ status: backendStatus[status], page: String(page), pageSize: "20", ...(query ? { q: query } : {}) }).toString(), [page, query, status]);

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
    mutationFn: async (action: "VERIFY" | "REJECT") => {
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
    { key: "name", header: "Tổ chức", cell: (item) => <button className="flex items-center gap-2 text-left" onClick={() => setSelectedId(item.id)}>{item.logoUrl && <img src={item.logoUrl} alt="" className="h-6 w-6 rounded object-contain" />}<p className="font-semibold hover:text-primary">{item.name}</p></button> },
    { key: "industry", header: "Lĩnh vực", cell: (item) => item.industrySector ?? "—" },
    { key: "province", header: "Tỉnh/thành", cell: (item) => item.provinceCity ?? "—" },
    { key: "scholarships", header: "Tin đã đăng", cell: (item) => item._count.scholarships },
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
          <div className="relative max-w-lg flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên tổ chức…" /></div>
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
                <div><dt className="text-muted-foreground">Website</dt><dd className="font-medium">{detail.data.website ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Lĩnh vực</dt><dd className="font-medium">{detail.data.industrySector ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Tỉnh/thành</dt><dd className="font-medium">{detail.data.provinceCity ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Năm thành lập</dt><dd className="font-medium">{detail.data.foundingYear ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Quy mô</dt><dd className="font-medium">{detail.data.companySize ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Trụ sở</dt><dd className="font-medium">{detail.data.headquartersAddress ?? "Chưa cung cấp"}</dd></div>
                <div><dt className="text-muted-foreground">Thành viên</dt><dd className="font-medium">{detail.data.members.length}</dd></div>
              </dl>
            </div>
            {detail.data.duplicates.length > 0 && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"><div className="flex gap-2 font-semibold"><AlertTriangle className="h-5 w-5" />Phát hiện tổ chức có thể trùng lặp</div>{detail.data.duplicates.map((item) => <p key={item.id} className="mt-2">{item.name} · {item.status}</p>)}</div>}
            <div>
              <h3 className="mb-2 font-semibold">Thành viên</h3>
              <div className="divide-y rounded-lg border">{detail.data.members.map(({ user }) => <div key={user.id} className="p-3 text-sm"><p className="font-medium">{user.email ?? user.id}</p><p className="text-xs text-muted-foreground">{user.role}</p></div>)}</div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Lịch sử xử lý</h3>
              {detail.data.history.length === 0 ? <p className="rounded-lg border p-4 text-sm text-muted-foreground">Chưa có lịch sử xử lý.</p> : <div className="divide-y rounded-lg border">{detail.data.history.map((entry) => <div key={entry.id} className="p-3 text-sm"><p className="font-medium">{entry.action}</p>{entry.reason && <p className="mt-0.5 text-xs italic text-muted-foreground">&ldquo;{entry.reason}&rdquo;</p>}<p className="mt-1 text-xs text-muted-foreground">{formatDate(entry.createdAt, "dd/MM/yyyy HH:mm")}</p></div>)}</div>}
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Lý do (bắt buộc khi từ chối)</h3>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu rõ lý do từ chối…" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled={decision.isPending} onClick={() => decision.mutate("VERIFY")}>Duyệt KYC</Button>
              <Button variant="destructive" disabled={!reason.trim() || decision.isPending} onClick={() => decision.mutate("REJECT")}>Từ chối</Button>
            </div>
          </div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Headphones, MessageSquareText, Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
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

type ConsultStatus = "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
type ConsultPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type ConsultRow = {
  id: string; subject: string; content: string; status: ConsultStatus; priority: ConsultPriority;
  guestName: string | null; guestEmail: string | null; slaDueAt: string | null; createdAt: string;
  requester: { id: string; email: string | null; profile: { fullName: string | null } | null } | null;
  assignee: { id: string; email: string | null } | null; _count: { messages: number };
};
type ConsultDetail = ConsultRow & { messages: Array<{ id: string; content: string; internal: boolean; createdAt: string; author: { email: string | null } | null }> };
type ListResponse = { items: ConsultRow[]; pagination: { page: number; pageCount: number; total: number } };

export function ConsultingManagement() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(params.get("query") ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [internal, setInternal] = useState(false);
  const queryString = params.toString();
  const list = useQuery({
    queryKey: ["admin-consulting", queryString],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/consulting?${queryString}`);
      if (!response.ok) throw new Error("Không thể tải hàng đợi tư vấn.");
      return response.json() as Promise<ListResponse>;
    },
    placeholderData: keepPreviousData,
  });
  const detail = useQuery({
    queryKey: ["admin-consulting-detail", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/consulting/${selectedId}`);
      if (!response.ok) throw new Error("Không thể tải hội thoại.");
      return response.json() as Promise<ConsultDetail>;
    },
  });
  const templates = useQuery({
    queryKey: ["admin-consulting-templates"],
    queryFn: async () => {
      const response = await authClient.fetch("/api/v1/admin/consulting/templates");
      return response.ok ? response.json() as Promise<Array<{ id: string; name: string; content: string }>> : [];
    },
  });
  const update = useMutation({
    mutationFn: async (payload: Partial<{ status: ConsultStatus; priority: ConsultPriority; assigneeId: string }>) => {
      const response = await authClient.fetch(`/api/v1/admin/consulting/${selectedId}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Không thể cập nhật ticket.");
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật ticket.");
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-consulting"] }), queryClient.invalidateQueries({ queryKey: ["admin-consulting-detail", selectedId] })]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const reply = useMutation({
    mutationFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/consulting/${selectedId}/messages`, { method: "POST", body: JSON.stringify({ content: message, internal }) });
      if (!response.ok) throw new Error("Không thể gửi nội dung.");
    },
    onSuccess: async () => {
      toast.success(internal ? "Đã lưu ghi chú nội bộ." : "Đã trả lời và gửi email.");
      setMessage("");
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-consulting"] }), queryClient.invalidateQueries({ queryKey: ["admin-consulting-detail", selectedId] })]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const setParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`/admin/consulting?${next.toString()}`, { scroll: false });
  };
  const columns: readonly DataTableColumn<ConsultRow>[] = [
    { key: "subject", header: "Yêu cầu", cell: (item) => <button className="max-w-[360px] text-left" onClick={() => setSelectedId(item.id)}><p className="font-semibold">{item.subject}</p><p className="truncate text-xs text-muted-foreground">{item.requester?.profile?.fullName ?? item.requester?.email ?? item.guestEmail ?? "Khách"}</p></button> },
    { key: "status", header: "Trạng thái", cell: (item) => <Badge variant="secondary">{item.status}</Badge> },
    { key: "priority", header: "Ưu tiên", cell: (item) => <Badge variant={item.priority === "URGENT" ? "destructive" : "outline"}>{item.priority}</Badge> },
    { key: "sla", header: "SLA", cell: (item) => {
      const overdue = item.slaDueAt && new Date(item.slaDueAt).getTime() < Date.now() && !["RESOLVED", "CLOSED"].includes(item.status);
      return <span className={cn("inline-flex items-center gap-1 text-sm", overdue && "font-semibold text-red-600")}><Clock3 className="h-4 w-4" />{item.slaDueAt ? formatDate(item.slaDueAt, "dd/MM HH:mm") : "—"}</span>;
    } },
    { key: "assignee", header: "Phụ trách", cell: (item) => item.assignee?.email ?? "Chưa gán" },
    { key: "messages", header: "Tin nhắn", cell: (item) => item._count.messages },
    { key: "action", header: "", cell: (item) => <Button size="sm" variant="ghost" onClick={() => setSelectedId(item.id)}>Mở</Button> },
  ];
  return <div className="mx-auto max-w-[1440px]">
    <PageHeader title="Hàng đợi tư vấn" description="Thread hai chiều, ghi chú nội bộ, SLA, ưu tiên và mẫu trả lời." icon={Headphones} />
    <Card className="overflow-hidden">
      <form className="grid gap-3 border-b p-4 md:grid-cols-[1fr_200px_180px_auto]" onSubmit={(event) => { event.preventDefault(); setParams({ query: search.trim() || undefined, page: "1" }); }}>
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Chủ đề hoặc email..." /></div>
        <Select value={params.get("status") ?? "all"} onValueChange={(value) => setParams({ status: value === "all" ? undefined : value, page: "1" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
        <Select value={params.get("priority") ?? "all"} onValueChange={(value) => setParams({ priority: value === "all" ? undefined : value, page: "1" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi mức ưu tiên</SelectItem>{["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
        <Button type="submit">Tìm</Button>
      </form>
      <DataTable columns={columns} rows={list.data?.items ?? []} getRowId={(item) => item.id} loading={list.isLoading} error={list.error instanceof Error ? list.error.message : null} page={list.data?.pagination.page ?? 1} pageCount={list.data?.pagination.pageCount ?? 1} onPageChange={(page) => setParams({ page: String(page) })} footerLabel={list.data ? `${list.data.items.length} / ${list.data.pagination.total} ticket` : "Đang tải"} />
    </Card>
    <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetTitle>{detail.data?.subject ?? "Yêu cầu tư vấn"}</SheetTitle>
        <SheetDescription>Khách không nhìn thấy các tin được đánh dấu nội bộ.</SheetDescription>
        {detail.data && <div className="space-y-5 py-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={detail.data.status} onValueChange={(value) => update.mutate({ status: value as ConsultStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
            <Select value={detail.data.priority} onValueChange={(value) => update.mutate({ priority: value as ConsultPriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="rounded-lg border p-4 text-sm"><p>{detail.data.content}</p></div>
          <div className="space-y-3">{detail.data.messages.map((item) => <div key={item.id} className={cn("rounded-lg border p-3 text-sm", item.internal && "border-amber-300 bg-amber-50 dark:bg-amber-950/20")}><div className="mb-1 flex justify-between gap-3 text-xs text-muted-foreground"><span>{item.internal ? "Ghi chú nội bộ" : item.author?.email ?? "Khách"}</span><span>{formatDate(item.createdAt, "dd/MM HH:mm")}</span></div><p className="whitespace-pre-wrap">{item.content}</p></div>)}</div>
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex flex-wrap gap-2">{templates.data?.map((template) => <Button key={template.id} type="button" variant="outline" size="sm" onClick={() => setMessage(template.content)}>{template.name}</Button>)}</div>
            <Textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nhập câu trả lời hoặc ghi chú..." />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} /> Ghi chú nội bộ</label>
            <Button disabled={!message.trim() || reply.isPending} onClick={() => reply.mutate()}><MessageSquareText className="h-4 w-4" />{internal ? "Lưu ghi chú" : "Trả lời và gửi email"}</Button>
          </div>
        </div>}
      </SheetContent>
    </Sheet>
  </div>;
}

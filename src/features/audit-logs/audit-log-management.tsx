"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, History, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";

// AdminAuditLog thật chỉ có adminId/action/targetId/reason/loggedAt (xem CLAUDE.md) — không có
// entityType tách riêng, không có ipHash, không có metadata JSON tuỳ ý. Trước đây type/UI được thiết kế
// cho một audit log phong phú hơn nhiều (actor.profile lồng nhau, entityType+entityId, ipHash, blob
// metadata) không khớp field nào của response thật, nên toàn bộ cột đó luôn hiện "—"/"Hệ thống".
type AuditRow = { id: string; actorId: string; actorEmail: string; action: string; reason: string | null; targetId: string; loggedAt: string };
type AuditResponse = { items: AuditRow[]; pagination: { page: number; pageSize: number; total: number; pageCount: number } };

export function AuditLogManagement() {
  const params = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [targetId, setTargetId] = useState(params.get("targetId") ?? "");
  const [action, setAction] = useState(params.get("action") ?? "");
  const [actorId, setActorId] = useState(params.get("actorId") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const query = useQuery({
    queryKey: ["audit-logs", params.toString()],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/audit-logs?${params.toString()}`);
      if (!response.ok) throw new Error("Không thể tải nhật ký thao tác.");
      return response.json() as Promise<AuditResponse>;
    },
  });
  const apply = () => {
    const next = new URLSearchParams();
    if (targetId) next.set("targetId", targetId);
    if (action) next.set("action", action);
    if (actorId) next.set("actorId", actorId);
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    next.set("pageSize", "100");
    router.replace(`/admin/audit-logs?${next.toString()}`, { scroll: false });
  };
  const columns: readonly DataTableColumn<AuditRow>[] = [
    { key: "loggedAt", header: "Thời gian", cell: (item) => formatDate(item.loggedAt, "dd/MM/yyyy HH:mm") },
    { key: "actor", header: "Người thực hiện", cell: (item) => item.actorEmail },
    { key: "action", header: "Hành động", cell: (item) => <code className="text-xs">{item.action}</code> },
    { key: "targetId", header: "Đối tượng", cell: (item) => <span className="font-mono text-xs">{item.targetId}</span> },
    { key: "reason", header: "Lý do", cell: (item) => item.reason ?? "—" },
    { key: "detail", header: "", cell: (item) => <Button variant="ghost" size="icon" onClick={() => setSelected(item)}><Eye className="h-4 w-4" /></Button> },
  ];
  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Nhật ký thao tác" description="Dữ liệu chỉ đọc; API không cung cấp hành động sửa hoặc xóa AuditLog." icon={History} />
      <Card className="overflow-hidden">
        <form className="grid gap-2 border-b p-4 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); apply(); }}>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={action} onChange={(event) => setAction(event.target.value)} placeholder="Hành động (vd. scholarship.approve)…" /></div>
          <Input value={actorId} onChange={(event) => setActorId(event.target.value)} placeholder="ID admin thực hiện…" />
          <Input value={targetId} onChange={(event) => setTargetId(event.target.value)} placeholder="ID đối tượng bị tác động…" />
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Từ ngày" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Đến ngày" />
          <Button type="submit">Lọc nhật ký</Button>
        </form>
        <DataTable
          columns={columns}
          rows={query.data?.items ?? []}
          getRowId={(item) => item.id}
          loading={query.isLoading}
          error={query.error instanceof Error ? query.error.message : null}
          footerLabel={query.data ? `${query.data.items.length} / ${query.data.pagination.total} bản ghi` : "Đang tải"}
          csv={{
            fileName: "topscholar-audit-logs.csv",
            columns: [
              { header: "ID", value: (item) => item.id },
              { header: "Thời gian", value: (item) => item.loggedAt },
              { header: "Người thực hiện", value: (item) => item.actorEmail },
              { header: "Hành động", value: (item) => item.action },
              { header: "Đối tượng", value: (item) => item.targetId },
              { header: "Lý do", value: (item) => item.reason },
            ],
          }}
        />
      </Card>
      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetTitle>Chi tiết nhật ký</SheetTitle>
          <SheetDescription className="mt-1">Toàn bộ field có thật trong AdminAuditLog.</SheetDescription>
          {selected && <div className="space-y-4 py-5 text-sm">
            <dl className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Hành động</dt><dd className="font-medium">{selected.action}</dd></div>
              <div><dt className="text-muted-foreground">Thời gian</dt><dd className="font-medium">{new Date(selected.loggedAt).toLocaleString("vi-VN")}</dd></div>
              <div><dt className="text-muted-foreground">Người thực hiện</dt><dd className="font-medium">{selected.actorEmail}</dd></div>
              <div><dt className="text-muted-foreground">Đối tượng</dt><dd className="break-all font-medium">{selected.targetId}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Lý do</dt><dd className="font-medium">{selected.reason ?? "Không có lý do đính kèm."}</dd></div>
            </dl>
          </div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

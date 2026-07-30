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

type AuditRow = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipHash: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { email: string | null; profile: { fullName: string | null } | null } | null;
};
type AuditResponse = { items: AuditRow[]; nextCursor: string | null };

export function AuditLogManagement() {
  const params = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [entityId, setEntityId] = useState(params.get("entityId") ?? "");
  const [action, setAction] = useState(params.get("action") ?? "");
  const [actorId, setActorId] = useState(params.get("actorId") ?? "");
  const [entityType, setEntityType] = useState(params.get("entityType") ?? "");
  const [ipHash, setIpHash] = useState(params.get("ipHash") ?? "");
  const [dateFrom, setDateFrom] = useState(params.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(params.get("dateTo") ?? "");
  const query = useQuery({
    queryKey: ["audit-logs", params.toString()],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/audit-logs?${params.toString()}`);
      if (!response.ok) throw new Error("Không thể tải nhật ký thao tác.");
      return response.json() as Promise<AuditResponse>;
    },
  });
  const apply = () => {
    const next = new URLSearchParams(params.toString());
    entityId ? next.set("entityId", entityId) : next.delete("entityId");
    action ? next.set("action", action) : next.delete("action");
    actorId ? next.set("actorId", actorId) : next.delete("actorId");
    entityType ? next.set("entityType", entityType) : next.delete("entityType");
    ipHash ? next.set("ipHash", ipHash) : next.delete("ipHash");
    dateFrom ? next.set("dateFrom", dateFrom) : next.delete("dateFrom");
    dateTo ? next.set("dateTo", dateTo) : next.delete("dateTo");
    next.set("limit", "100");
    router.replace(`/admin/audit-logs?${next.toString()}`, { scroll: false });
  };
  const columns: readonly DataTableColumn<AuditRow>[] = [
    { key: "createdAt", header: "Thời gian", cell: (item) => formatDate(item.createdAt, "dd/MM/yyyy HH:mm") },
    { key: "actor", header: "Người thực hiện", cell: (item) => <div><p className="font-medium">{item.actor?.profile?.fullName ?? item.actor?.email ?? "Hệ thống"}</p><p className="text-xs text-muted-foreground">{item.actorId ?? "—"}</p></div> },
    { key: "action", header: "Hành động", cell: (item) => <code className="text-xs">{item.action}</code> },
    { key: "entityType", header: "Thực thể", cell: (item) => `${item.entityType} · ${item.entityId ?? "—"}` },
    { key: "ipHash", header: "Dấu vết IP", cell: (item) => item.ipHash ? `${item.ipHash.slice(0, 12)}…` : "—" },
    { key: "detail", header: "", cell: (item) => <Button variant="ghost" size="icon" onClick={() => setSelected(item)}><Eye className="h-4 w-4" /></Button> },
  ];
  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Nhật ký thao tác" description="Dữ liệu chỉ đọc; API không cung cấp hành động sửa hoặc xóa AuditLog." icon={History} />
      <Card className="overflow-hidden">
        <form className="grid gap-2 border-b p-4 md:grid-cols-4" onSubmit={(event) => { event.preventDefault(); apply(); }}>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={action} onChange={(event) => setAction(event.target.value)} placeholder="Hành động chính xác…" /></div>
          <Input value={actorId} onChange={(event) => setActorId(event.target.value)} placeholder="Actor ID…" />
          <Input value={entityType} onChange={(event) => setEntityType(event.target.value)} placeholder="Loại thực thể…" />
          <Input value={entityId} onChange={(event) => setEntityId(event.target.value)} placeholder="Mã thực thể…" />
          <Input value={ipHash} onChange={(event) => setIpHash(event.target.value)} placeholder="IP hash…" />
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Từ ngày" />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Đến ngày" />
          <Button type="submit">Lọc nhật ký</Button>
        </form>
        <DataTable
          columns={columns}
          rows={query.data?.items ?? []}
          getRowId={(item) => item.id}
          loading={query.isLoading}
          error={query.error instanceof Error ? query.error.message : null}
          footerLabel={query.data ? `${query.data.items.length} bản ghi gần nhất` : "Đang tải"}
          csv={{
            fileName: "topscholar-audit-logs.csv",
            columns: [
              { header: "ID", value: (item) => item.id },
              { header: "Thời gian", value: (item) => item.createdAt },
              { header: "Actor ID", value: (item) => item.actorId },
              { header: "Hành động", value: (item) => item.action },
              { header: "Loại thực thể", value: (item) => item.entityType },
              { header: "Mã thực thể", value: (item) => item.entityId },
              { header: "IP hash", value: (item) => item.ipHash },
            ],
          }}
        />
      </Card>
      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetTitle>Chi tiết AuditLog</SheetTitle>
          <SheetDescription className="mt-1">Giá trị metadata được hiển thị nguyên trạng để truy vết.</SheetDescription>
          {selected && <div className="space-y-4 py-5 text-sm">
            <dl className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Hành động</dt><dd className="font-medium">{selected.action}</dd></div>
              <div><dt className="text-muted-foreground">Thời gian</dt><dd className="font-medium">{new Date(selected.createdAt).toLocaleString("vi-VN")}</dd></div>
              <div><dt className="text-muted-foreground">Thực thể</dt><dd className="font-medium">{selected.entityType}</dd></div>
              <div><dt className="text-muted-foreground">Mã thực thể</dt><dd className="break-all font-medium">{selected.entityId ?? "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">IP hash</dt><dd className="break-all font-mono text-xs">{selected.ipHash ?? "—"}</dd></div>
            </dl>
            <div><h3 className="mb-2 font-semibold">Trước / sau, lý do và metadata</h3><pre className="max-h-[480px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(selected.metadata, null, 2)}</pre></div>
          </div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

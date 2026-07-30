"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, ShieldBan, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";

const filtersSchema = z.object({
  query: z.string().max(100),
  role: z.enum(["all", "CANDIDATE", "PARTNER", "SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"]),
  status: z.enum(["all", "PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DISABLED"]),
  dateFrom: z.string(),
  dateTo: z.string(),
});

type FilterValues = z.infer<typeof filtersSchema>;
type ApiUser = {
  id: string;
  email: string | null;
  phone: string | null;
  role: "CANDIDATE" | "PARTNER" | "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "SUPPORT";
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DISABLED";
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};
type UsersResponse = {
  items: ApiUser[];
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
};

const roleLabels: Record<ApiUser["role"], string> = {
  CANDIDATE: "Ứng viên",
  PARTNER: "Đối tác",
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MODERATOR: "Kiểm duyệt",
  SUPPORT: "Hỗ trợ",
};

export function UserManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const page = positiveInt(searchParams.get("page"), 1);
  const pageSize = positiveInt(searchParams.get("pageSize"), 20);
  const sort: DataTableSort = {
    key: searchParams.get("sortBy") ?? "createdAt",
    direction: searchParams.get("sortDirection") === "asc" ? "asc" : "desc",
  };
  const filterValues: FilterValues = {
    query: searchParams.get("query") ?? "",
    role: (searchParams.get("role") as FilterValues["role"]) ?? "all",
    status: (searchParams.get("status") as FilterValues["status"]) ?? "all",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
  };

  const form = useForm<FilterValues>({ resolver: zodResolver(filtersSchema), values: filterValues });
  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("sortBy", sort.key);
    params.set("sortDirection", sort.direction);
    return params.toString();
  }, [page, pageSize, searchParams, sort.direction, sort.key]);

  const usersQuery = useQuery({
    queryKey: ["admin-users", queryString],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/users?${queryString}`);
      if (!response.ok) throw new Error(response.status === 403 ? "Bạn không có quyền xem người dùng." : "API người dùng không phản hồi.");
      return response.json() as Promise<UsersResponse>;
    },
    placeholderData: keepPreviousData,
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: readonly string[]) => {
      const response = await authClient.fetch("/api/v1/admin/users/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Không thể vô hiệu hóa các tài khoản đã chọn.");
      return response.json() as Promise<{ affectedCount: number }>;
    },
    onSuccess: async (result) => {
      toast.success(`Đã vô hiệu hóa ${result.affectedCount} tài khoản.`);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    router.replace(`/admin/users?${params.toString()}`, { scroll: false });
  };

  const applyFilters = (values: FilterValues) => setParams({
    query: values.query.trim() || undefined,
    role: values.role === "all" ? undefined : values.role,
    status: values.status === "all" ? undefined : values.status,
    dateFrom: values.dateFrom || undefined,
    dateTo: values.dateTo || undefined,
    page: "1",
  });

  const columns: readonly DataTableColumn<ApiUser>[] = [
    { key: "email", header: "Tài khoản", sortable: true, cell: (user) => <div><p className="font-semibold">{user.email ?? "Chưa có email"}</p><p className="text-xs text-muted-foreground">{user.phone ?? user.id}</p></div> },
    { key: "role", header: "Vai trò", sortable: true, cell: (user) => <Badge variant="secondary">{roleLabels[user.role]}</Badge> },
    { key: "status", header: "Trạng thái", sortable: true, cell: (user) => <StatusBadge status={statusForBadge(user.status)} /> },
    { key: "verified", header: "Xác minh", cell: (user) => user.emailVerified ? "Đã xác minh" : "Chưa xác minh" },
    { key: "createdAt", header: "Ngày tạo", sortable: true, cell: (user) => formatDate(user.createdAt) },
    { key: "lastLoginAt", header: "Đăng nhập gần nhất", sortable: true, cell: (user) => user.lastLoginAt ? formatDate(user.lastLoginAt, "dd/MM/yyyy HH:mm") : "Chưa đăng nhập" },
    { key: "action", header: "", cell: (user) => <Button asChild variant="ghost" size="sm"><Link href={`/admin/users/${user.id}`}>Chi tiết</Link></Button> },
  ];

  const activeFilters = [
    filterValues.query ? { key: "query", label: `Từ khóa: ${filterValues.query}`, onRemove: () => setParams({ query: undefined, page: "1" }) } : null,
    filterValues.role !== "all" ? { key: "role", label: `Vai trò: ${roleLabels[filterValues.role]}`, onRemove: () => setParams({ role: undefined, page: "1" }) } : null,
    filterValues.status !== "all" ? { key: "status", label: `Trạng thái: ${filterValues.status}`, onRemove: () => setParams({ status: undefined, page: "1" }) } : null,
    filterValues.dateFrom ? { key: "dateFrom", label: `Từ: ${filterValues.dateFrom}`, onRemove: () => setParams({ dateFrom: undefined, page: "1" }) } : null,
    filterValues.dateTo ? { key: "dateTo", label: `Đến: ${filterValues.dateTo}`, onRemove: () => setParams({ dateTo: undefined, page: "1" }) } : null,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Quản lý người dùng"
        description="Dữ liệu thật từ PostgreSQL, phân trang và lọc ở phía máy chủ."
        icon={Users}
        action={<Button variant="outline" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}><RefreshCw className={usersQuery.isFetching ? "animate-spin" : ""} />Làm mới</Button>}
      />

      <Card className="overflow-hidden">
        <form className="grid gap-3 border-b p-4 lg:grid-cols-[minmax(240px,1fr)_180px_200px_160px_160px_auto]" onSubmit={form.handleSubmit(applyFilters)}>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Email, số điện thoại..." {...form.register("query")} /></div>
          <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value as FilterValues["role"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả vai trò</SelectItem>{Object.entries(roleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as FilterValues["status"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="ACTIVE">Hoạt động</SelectItem><SelectItem value="PENDING_VERIFICATION">Chờ xác minh</SelectItem><SelectItem value="SUSPENDED">Tạm khóa</SelectItem><SelectItem value="DISABLED">Vô hiệu hóa</SelectItem></SelectContent></Select>
          <Input type="date" aria-label="Từ ngày" {...form.register("dateFrom")} />
          <Input type="date" aria-label="Đến ngày" {...form.register("dateTo")} />
          <Button type="submit">Áp dụng</Button>
        </form>

        <DataTable
          columns={columns}
          rows={usersQuery.data?.items ?? []}
          getRowId={(user) => user.id}
          loading={usersQuery.isLoading}
          error={usersQuery.error instanceof Error ? usersQuery.error.message : null}
          emptyTitle="Không có người dùng phù hợp"
          filters={activeFilters}
          selectable
          renderBulkActions={(selected, clear) => <Button variant="destructive" size="sm" disabled={bulkDelete.isPending} onClick={() => bulkDelete.mutate(selected.map((user) => user.id), { onSuccess: clear })}><ShieldBan className="h-4 w-4" />Vô hiệu hóa</Button>}
          sort={sort}
          onSortChange={(next) => setParams({ sortBy: next.key, sortDirection: next.direction, page: "1" })}
          page={usersQuery.data?.pagination.page ?? page}
          pageCount={usersQuery.data?.pagination.pageCount ?? 1}
          onPageChange={(nextPage) => setParams({ page: String(nextPage) })}
          footerLabel={usersQuery.data ? `${usersQuery.data.items.length} / ${usersQuery.data.pagination.total} người dùng` : "Đang tải dữ liệu"}
          csv={{
            fileName: `topscholar-users-page-${page}.csv`,
            columns: [
              { header: "ID", value: (user) => user.id },
              { header: "Email", value: (user) => user.email },
              { header: "Điện thoại", value: (user) => user.phone },
              { header: "Vai trò", value: (user) => user.role },
              { header: "Trạng thái", value: (user) => user.status },
              { header: "Ngày tạo", value: (user) => user.createdAt },
            ],
          }}
        />
      </Card>
    </div>
  );
}

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function statusForBadge(status: ApiUser["status"]) {
  if (status === "ACTIVE") return "active" as const;
  if (status === "PENDING_VERIFICATION") return "pending" as const;
  return "blocked" as const;
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Check, ChevronLeft, ChevronRight, Download, Eye, RefreshCw, Search, ShieldAlert, UserCog, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// Hệ thống chỉ có 4 vai trò thật (User.roles: candidate/partner/mentor/admin — không có phân cấp
// SUPER_ADMIN/MODERATOR/SUPPORT nào, admin_role_permissions chưa được enforce ở đâu cả, xem CLAUDE.md).
// Trước đây map nhầm "mentor" thành "MODERATOR" (chỉ vì tên gần giống — hai vai trò hoàn toàn khác nhau)
// và chỉ lấy roles[0], làm mất thông tin những tài khoản có nhiều vai trò cùng lúc (vd vừa candidate vừa
// mentor). Giờ hiện đủ toàn bộ roles[] thật dưới dạng badge, không rút gọn về 1 vai trò.
type UserRole = "candidate" | "partner" | "mentor" | "admin";
type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DISABLED";
type ApiUser = { id: string; email: string | null; phone: string | null; displayName: string | null; roles: UserRole[]; status: UserStatus; emailVerified: boolean; lastLoginAt: string | null; createdAt: string; updatedAt: string };
type UsersResponse = { items: ApiUser[]; pagination: { page: number; pageSize: number; total: number; pageCount: number } };
type BackendUser = {
  id: string; email: string | null; roles: UserRole[]; status: string; isEmailVerified: boolean; lastLoginAt: string | null; createdAt: string; updatedAt: string;
  candidateProfile?: { fullName: string | null; phone: string | null } | null;
  partnerProfile?: { companyName: string | null } | null;
  mentorProfile?: { fullName: string | null } | null;
};
type BackendUsersResponse = { items: BackendUser[]; pagination: { page: number; pageSize: number; total: number; pages: number } };

const normalizeUsers = (data: BackendUsersResponse): UsersResponse => ({
  items: data.items.map((user) => {
    const status: UserStatus = !user.isEmailVerified && user.status === "active" ? "PENDING_VERIFICATION" : user.status === "suspended" ? "SUSPENDED" : user.status === "disabled" ? "DISABLED" : "ACTIVE";
    return {
      id: user.id, email: user.email, roles: user.roles, status, emailVerified: Boolean(user.isEmailVerified),
      lastLoginAt: user.lastLoginAt, createdAt: user.createdAt, updatedAt: user.updatedAt,
      phone: user.candidateProfile?.phone ?? null,
      displayName: user.candidateProfile?.fullName ?? user.partnerProfile?.companyName ?? user.mentorProfile?.fullName ?? null,
    };
  }),
  pagination: { ...data.pagination, pageCount: data.pagination.pages },
});

const roles: Record<UserRole, string> = { candidate: "Ứng viên", partner: "Đối tác", mentor: "Mentor", admin: "Quản trị viên" };
const statuses: Record<UserStatus, string> = {
  ACTIVE: "Đang hoạt động", PENDING_VERIFICATION: "Chưa xác minh",
  SUSPENDED: "Tạm khóa", DISABLED: "Đã vô hiệu hóa",
};
const cards: Array<{ value: "all" | UserStatus; label: string; hint: string; dot: string; active: string }> = [
  { value: "all", label: "Tất cả người dùng", hint: "Tổng số tài khoản", dot: "bg-blue-500", active: "border-t-blue-500 bg-blue-50" },
  { value: "ACTIVE", label: "Đang hoạt động", hint: "Có thể sử dụng nền tảng", dot: "bg-emerald-500", active: "border-t-emerald-500 bg-emerald-50" },
  { value: "PENDING_VERIFICATION", label: "Chưa xác minh", hint: "Cần hoàn tất xác minh", dot: "bg-orange-500", active: "border-t-orange-500 bg-orange-50" },
  { value: "SUSPENDED", label: "Tạm khóa", hint: "Có thể mở lại", dot: "bg-amber-500", active: "border-t-amber-500 bg-amber-50" },
  { value: "DISABLED", label: "Đã vô hiệu hóa", hint: "Không thể đăng nhập", dot: "bg-red-500", active: "border-t-red-500 bg-red-50" },
];

export function UserManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(searchParams.get("query") ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<ApiUser | null>(null);
  const page = positiveInt(searchParams.get("page"), 1);
  const pageSize = positiveInt(searchParams.get("pageSize"), 20);
  const role = (searchParams.get("role") as UserRole | null) ?? "all";
  const status = (searchParams.get("status") as UserStatus | null) ?? "all";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const lastLogin = searchParams.get("lastLogin") ?? "all";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page)); params.set("pageSize", String(pageSize));
    params.set("sort", "created_desc");
    const requestedQuery = searchParams.get("query");
    if (requestedQuery) params.set("q", requestedQuery);
    if (role !== "all") params.set("role", role);
    if (status !== "all" && status !== "PENDING_VERIFICATION") params.set("status", status.toLowerCase());
    if (dateFrom) params.set("createdFrom", dateFrom);
    return params.toString();
  }, [dateFrom, page, pageSize, role, searchParams, status]);

  const usersQuery = useQuery({
    queryKey: ["admin-users", queryString], placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/users?${queryString}`);
      if (!response.ok) throw new Error(response.status === 403 ? "Bạn không có quyền xem danh sách người dùng." : "Không thể tải dữ liệu người dùng. Vui lòng kiểm tra kết nối máy chủ.");
      return normalizeUsers(await response.json() as BackendUsersResponse);
    },
  });
  // GET /admin/users/stats trả thẳng {all, active, suspended, disabled, unverified} — dùng đúng 1 lệnh
  // gọi thay vì trước đây gọi 5 lần /admin/users?pageSize=100 rồi đếm client-side (vừa tốn, vừa có bug:
  // đếm PENDING_VERIFICATION bằng filter trên tối đa 100 dòng nên sai nếu có hơn 100 tài khoản chưa xác
  // minh).
  const statsQuery = useQuery({
    queryKey: ["admin-user-status-counts"],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/users/stats`);
      if (!response.ok) throw new Error("Không thể tải thống kê.");
      const data = await response.json() as { all: number; active: number; suspended: number; disabled: number; unverified: number };
      return { all: data.all, ACTIVE: data.active, SUSPENDED: data.suspended, DISABLED: data.disabled, PENDING_VERIFICATION: data.unverified } as Record<"all" | UserStatus, number>;
    },
  });
  const disableUsers = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await authClient.fetch("/api/v1/admin/users/bulk-actions", { method: "POST", body: JSON.stringify({ ids, action: "disable", reason: "Disabled from admin console" }) });
      if (!response.ok) throw new Error("Không thể vô hiệu hóa các tài khoản đã chọn.");
      const result = await response.json() as { affected: number };
      return { affectedCount: result.affected };
    },
    onSuccess: async ({ affectedCount }) => {
      toast.success(`Đã vô hiệu hóa ${affectedCount} tài khoản.`); setSelected([]);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-users"] }), queryClient.invalidateQueries({ queryKey: ["admin-user-status-counts"] })]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    router.replace(params.size ? `/admin/users?${params}` : "/admin/users", { scroll: false }); setSelected([]);
  };
  const users = usersQuery.data?.items ?? [];
  const allSelected = users.length > 0 && users.every((user) => selected.includes(user.id));
  const exportCsv = () => {
    if (!users.length) return;
    const rows = [["Mã người dùng", "Email", "Số điện thoại", "Vai trò", "Trạng thái", "Ngày đăng ký", "Đăng nhập gần nhất"], ...users.map((user) => [user.id, user.email ?? "", user.phone ?? "", user.roles.map((r) => roles[r]).join(" / "), statuses[user.status], dateTime(user.createdAt), user.lastLoginAt ? dateTime(user.lastLoginAt) : "Chưa đăng nhập"])];
    const url = URL.createObjectURL(new Blob([`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `nguoi-dung-trang-${page}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="mx-auto max-w-[1440px] space-y-4 text-slate-900">
    <header className="flex flex-wrap items-end gap-4">
      <div><p className="text-[11px] font-semibold uppercase tracking-[.09em] text-slate-400">Vận hành</p><h1 className="text-2xl font-bold tracking-tight md:text-[26px]">Quản lý người dùng</h1></div>
      <div className="ml-auto flex flex-wrap items-center gap-2"><span className="mr-1 text-xs text-slate-400">Dữ liệu cập nhật theo thời gian thực</span><Button variant="outline" size="sm" onClick={exportCsv} disabled={!users.length}><Download />Xuất CSV</Button><Button variant="outline" size="sm" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}><RefreshCw className={cn(usersQuery.isFetching && "animate-spin")} />Làm mới</Button></div>
    </header>

    <section className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => <button key={card.value} type="button" onClick={() => setParams({ status: card.value === "all" ? undefined : card.value, page: "1" })} className={cn("min-h-[98px] border-t-[3px] border-t-transparent p-4 text-left hover:bg-slate-50", index > 0 && "border-l border-slate-200", status === card.value && card.active)}><span className="flex items-center gap-2 text-xs font-medium text-slate-500"><i className={cn("h-2 w-2 rounded-full", card.dot)} />{card.label}</span><strong className="mt-1 block text-2xl font-bold">{statsQuery.isLoading ? "—" : (statsQuery.data?.[card.value] ?? 0).toLocaleString("vi-VN")}</strong><span className="block text-[11px] text-slate-400">{card.hint}</span></button>)}
    </section>

    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form className="relative min-w-[280px] flex-1 lg:max-w-sm" onSubmit={(event) => { event.preventDefault(); setParams({ query: search.trim() || undefined, page: "1" }); }}><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 bg-white pl-9 pr-9" placeholder="Tìm tên, email, SĐT, mã người dùng..." />{search && <button type="button" onClick={() => { setSearch(""); setParams({ query: undefined, page: "1" }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>}</form>
        <Select value={role} onValueChange={(value) => setParams({ role: value === "all" ? undefined : value, page: "1" })}><SelectTrigger className="h-9 w-[180px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi vai trò</SelectItem>{Object.entries(roles).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={(value) => setParams({ status: value === "all" ? undefined : value, page: "1" })}><SelectTrigger className="h-9 w-[180px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi trạng thái</SelectItem>{Object.entries(statuses).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={dateFrom ? "custom" : "all"} onValueChange={(value) => { if (value === "all") return setParams({ dateFrom: undefined, page: "1" }); const from = new Date(); from.setDate(from.getDate() - Number(value)); setParams({ dateFrom: from.toISOString(), page: "1" }); }}><SelectTrigger className="h-9 w-[175px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi ngày đăng ký</SelectItem><SelectItem value="1">Trong 24 giờ</SelectItem><SelectItem value="7">7 ngày qua</SelectItem><SelectItem value="30">30 ngày qua</SelectItem><SelectItem value="90">90 ngày qua</SelectItem>{dateFrom && <SelectItem value="custom">Khoảng đang chọn</SelectItem>}</SelectContent></Select>
        <Select value={lastLogin} onValueChange={(value) => setParams({ lastLogin: value === "all" ? undefined : value, page: "1" })}><SelectTrigger className="h-9 w-[200px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi lần đăng nhập</SelectItem><SelectItem value="24h">Trong 24 giờ</SelectItem><SelectItem value="7d">Trong 7 ngày</SelectItem><SelectItem value="30d">Trong 30 ngày</SelectItem><SelectItem value="inactive90">Không hoạt động &gt; 90 ngày</SelectItem><SelectItem value="never">Chưa từng đăng nhập</SelectItem></SelectContent></Select>
        <Button variant="outline" size="sm" className="h-9" onClick={() => { setSearch(""); router.replace("/admin/users", { scroll: false }); usersQuery.refetch(); }}><RefreshCw />Làm mới</Button>
      </div>
    </section>

    {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800"><strong>{selected.length} tài khoản được chọn</strong><Button variant="outline" size="sm" className="h-8 border-red-200 text-red-700" disabled={disableUsers.isPending} onClick={() => disableUsers.mutate(selected)}><Ban />Vô hiệu hóa</Button><button type="button" className="ml-auto text-xs font-medium" onClick={() => setSelected([])}>Bỏ chọn</button></div>}

    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse">
        <thead><tr className="border-b bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[.055em] text-slate-500"><th className="w-11 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? selected.filter((id) => !users.some((user) => user.id === id)) : Array.from(new Set([...selected, ...users.map((user) => user.id)])))} aria-label="Chọn tất cả" className="h-4 w-4 accent-emerald-600" /></th><th className="min-w-[225px] px-3 py-3">Người dùng</th><th className="px-3 py-3">Vai trò</th><th className="min-w-[220px] px-3 py-3">Liên hệ và xác minh</th><th className="px-3 py-3">Ngày đăng ký</th><th className="px-3 py-3">Đăng nhập gần nhất</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3 text-right">Thao tác</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {usersQuery.isLoading && Array.from({ length: 6 }, (_, index) => <SkeletonRow key={index} />)}
          {usersQuery.isError && <tr><td colSpan={8} className="px-6 py-14 text-center"><ShieldAlert className="mx-auto h-8 w-8 text-red-400" /><p className="mt-3 font-medium">Không tải được danh sách người dùng</p><p className="mt-1 text-sm text-slate-500">{usersQuery.error.message}</p><Button className="mt-4" variant="outline" size="sm" onClick={() => usersQuery.refetch()}>Thử lại</Button></td></tr>}
          {!usersQuery.isLoading && !usersQuery.isError && !users.length && <tr><td colSpan={8} className="px-6 py-14 text-center"><Users className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-medium">Không tìm thấy người dùng</p><p className="mt-1 text-sm text-slate-500">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p></td></tr>}
          {users.map((user) => <UserRow key={user.id} user={user} checked={selected.includes(user.id)} onCheck={() => setSelected((current) => current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id])} onPreview={() => setPreview(user)} />)}
        </tbody>
      </table></div>
      <div className="flex flex-wrap items-center gap-3 border-t bg-slate-50 px-4 py-3 text-xs text-slate-500"><span>{usersQuery.data ? `Hiển thị ${users.length} trong tổng ${usersQuery.data.pagination.total.toLocaleString("vi-VN")} tài khoản` : "Đang tải dữ liệu"}</span><div className="ml-auto flex items-center gap-2"><Select value={String(pageSize)} onValueChange={(value) => setParams({ pageSize: value, page: "1" })}><SelectTrigger className="h-8 w-[105px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="20">20 dòng</SelectItem><SelectItem value="50">50 dòng</SelectItem><SelectItem value="100">100 dòng</SelectItem></SelectContent></Select><Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}><ChevronLeft /></Button><span className="min-w-16 text-center">Trang {page}/{usersQuery.data?.pagination.pageCount ?? 1}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= (usersQuery.data?.pagination.pageCount ?? 1)} onClick={() => setParams({ page: String(page + 1) })}><ChevronRight /></Button></div></div>
    </section>

    <aside className="rounded-lg border border-slate-200 border-l-[3px] border-l-emerald-500 bg-white p-4 text-sm shadow-sm"><h2 className="font-semibold">Quy tắc quản lý tài khoản</h2><p className="mt-1.5 leading-6 text-slate-500"><strong className="text-slate-700">Tạm khóa</strong> là trạng thái có thể mở lại; <strong className="text-slate-700">vô hiệu hóa</strong> ngăn hoàn toàn việc đăng nhập. Mọi thay đổi vai trò hoặc trạng thái phải có lý do và được ghi vào nhật ký thao tác.</p></aside>
    <Preview user={preview} onClose={() => setPreview(null)} />
  </div>;
}

function UserRow({ user, checked, onCheck, onPreview }: { user: ApiUser; checked: boolean; onCheck: () => void; onPreview: () => void }) {
  return <tr className={cn("text-[13px] hover:bg-slate-50", checked && "bg-emerald-50/60")}><td className="px-4 py-3"><input type="checkbox" checked={checked} onChange={onCheck} aria-label={`Chọn ${user.email ?? user.id}`} className="h-4 w-4 accent-emerald-600" /></td><td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{initials(user.displayName ?? user.email)}</span><div className="min-w-0"><p className="max-w-[185px] truncate font-semibold">{user.displayName ?? displayName(user.email)}</p><p className="text-[11px] text-slate-400">{shortId(user.id)}</p></div></div></td><td className="px-3 py-3"><Role roles={user.roles} /></td><td className="px-3 py-3"><p className="flex items-center gap-1.5 text-slate-600"><span className="max-w-[180px] truncate">{user.email ?? "Chưa có email"}</span>{user.emailVerified ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <span className="text-[11px] font-medium text-orange-600">chưa xác minh</span>}</p><p className="mt-1 text-[11px] text-slate-400">{user.phone ?? "Chưa cập nhật số điện thoại"}</p></td><td className="whitespace-nowrap px-3 py-3 text-slate-600">{date(user.createdAt)}</td><td className="whitespace-nowrap px-3 py-3 text-slate-600">{user.lastLoginAt ? relative(user.lastLoginAt) : "Chưa đăng nhập"}<span className="block text-[11px] text-slate-400">{user.lastLoginAt ? time(user.lastLoginAt) : "—"}</span></td><td className="px-3 py-3"><Status status={user.status} /></td><td className="px-3 py-3 text-right"><Button variant="ghost" size="sm" className="h-8 px-2 text-[#2C6EAF]" onClick={onPreview}><Eye />Xem</Button></td></tr>;
}

function Preview({ user, onClose }: { user: ApiUser | null; onClose: () => void }) {
  return <Sheet open={Boolean(user)} onOpenChange={(open) => !open && onClose()}><SheetContent className="w-full overflow-y-auto p-0 sm:max-w-[470px]">{user && <><div className="border-b px-5 py-5 pr-12"><SheetTitle className="text-lg font-bold">{user.displayName ?? displayName(user.email)}</SheetTitle><SheetDescription className="mt-1 text-xs">{shortId(user.id)} · {user.roles.map((r) => roles[r]).join(" / ")}</SheetDescription></div><div className="space-y-6 p-5"><div className={cn("rounded-lg border p-3 text-sm", user.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800")}>Tài khoản hiện ở trạng thái <strong>{statuses[user.status].toLowerCase()}</strong>.</div><section><h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Thông tin tài khoản</h3><div className="space-y-3"><Detail label="Email" value={user.email ?? "Chưa cập nhật"} /><Detail label="Xác minh email" value={user.emailVerified ? "Đã xác minh" : "Chưa xác minh"} /><Detail label="Điện thoại" value={user.phone ?? "Chưa cập nhật"} /><Detail label="Vai trò" value={user.roles.map((r) => roles[r]).join(", ")} /><Detail label="Ngày đăng ký" value={dateTime(user.createdAt)} /><Detail label="Đăng nhập gần nhất" value={user.lastLoginAt ? dateTime(user.lastLoginAt) : "Chưa đăng nhập"} /></div></section></div><div className="sticky bottom-0 border-t bg-slate-50 p-4"><Button asChild variant="outline" className="w-full"><Link href={`/admin/users/${user.id}`}><UserCog />Quản lý tài khoản</Link></Button></div></>}</SheetContent></Sheet>;
}

function Role({ roles: userRoles }: { roles: UserRole[] }) {
  const styles: Record<UserRole, string> = { candidate: "bg-blue-50 text-blue-700", partner: "bg-amber-50 text-amber-700", mentor: "bg-violet-50 text-violet-700", admin: "bg-emerald-50 text-emerald-700" };
  return <span className="flex flex-wrap gap-1">{userRoles.map((r) => <span key={r} className={cn("inline-flex rounded-md px-2.5 py-1 text-xs font-semibold", styles[r])}>{roles[r]}</span>)}</span>;
}
function Status({ status }: { status: UserStatus }) { const styles: Record<UserStatus, string> = { ACTIVE: "text-emerald-700 before:bg-emerald-500", PENDING_VERIFICATION: "text-orange-700 before:bg-orange-500", SUSPENDED: "text-amber-700 before:bg-amber-500", DISABLED: "text-red-700 before:bg-red-500" }; return <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold before:h-2 before:w-2 before:rounded-full", styles[status])}>{statuses[status]}</span>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[125px_1fr] gap-3 text-sm"><span className="text-slate-500">{label}</span><span className="break-words font-medium">{value}</span></div>; }
function SkeletonRow() { return <tr className="animate-pulse"><td className="px-4 py-4"><div className="h-4 w-4 rounded bg-slate-100" /></td><td className="px-3"><div className="h-8 w-40 rounded bg-slate-100" /></td>{Array.from({ length: 6 }, (_, index) => <td className="px-3" key={index}><div className="h-5 w-24 rounded bg-slate-100" /></td>)}</tr>; }
function displayName(email: string | null) { return email ? email.split("@")[0].split(/[._-]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ") : "Người dùng chưa đặt tên"; }
function initials(email: string | null) { return displayName(email).split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function shortId(id: string) { return `ND-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`; }
function date(value: string) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)); }
function time(value: string) { return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function dateTime(value: string) { return `${date(value)} · ${time(value)}`; }
function relative(value: string) { const target = new Date(value); const now = new Date(); const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()) / 86_400_000); return days === 0 ? "Hôm nay" : days === 1 ? "Hôm qua" : days > 1 && days < 7 ? `${days} ngày trước` : date(value); }
function csvCell(value: string) { return `"${value.replaceAll('"', '""')}"`; }
function positiveInt(value: string | null, fallback: number) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback; }

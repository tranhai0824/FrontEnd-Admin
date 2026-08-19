"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, LogOut, ShieldBan, Trash2, UserCog, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";

type Detail = {
  id: string; email: string | null; phone: string | null; roles: string[]; status: string; emailVerified: boolean; lastLoginAt: string | null; createdAt: string;
  profile: { fullName: string | null; gpa: number | null; educationLevel: string | null; provinceCity: string | null; bio: string | null } | null;
  memberships: Array<{ role: string; isOwner: boolean; organization: { id: string; name: string; status: string } }>;
  candidateApplications: Array<{ id: string; status: string; submittedAt: string | null; scholarship: { id: string; title: string } }>;
  logs: Array<{ id: string; action: string; reason: string | null; createdAt: string }>;
};
type Session = { id: string; userAgent: string | null; createdAt: string; expiresAt: string; revokedAt: string | null };
type Note = { id: string; content: string; createdAt: string; author?: { email?: string | null } };

type BackendApplication = {
  id: string;
  status: string;
  createdAt: string;
  scholarship: { id: string; title: string };
};

type BackendDetail = {
  id: string;
  email?: string | null;
  roles?: string[];
  status?: string;
  isEmailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  candidateProfile?: {
    fullName?: string | null;
    phone?: string | null;
    provinceCity?: string | null;
    gpa?: number | null;
    currentDegreeLevel?: string | null;
    applications?: BackendApplication[];
  } | null;
  mentorProfile?: { fullName?: string | null; bio?: string | null } | null;
  partnerProfile?: {
    id: string;
    companyName?: string | null;
    approvalStatus?: string | null;
    description?: string | null;
  } | null;
  auditLogs?: Array<{ id: string; action: string; reason: string | null; createdAt: string }>;
};

function normalizeDetail(data: BackendDetail): Detail {
  const profile = data.candidateProfile ?? data.mentorProfile ?? data.partnerProfile ?? null;
  return {
    id: data.id,
    email: data.email ?? null,
    phone: data.candidateProfile?.phone ?? null,
    roles: (data.roles?.length ? data.roles : ["candidate"]).map((role) => String(role).toUpperCase()),
    status: String(data.status ?? "active").toUpperCase(),
    emailVerified: Boolean(data.isEmailVerified),
    lastLoginAt: data.lastLoginAt ?? null,
    createdAt: data.createdAt,
    profile: profile ? {
      fullName: data.candidateProfile?.fullName ?? data.mentorProfile?.fullName ?? data.partnerProfile?.companyName ?? null,
      gpa: data.candidateProfile?.gpa ?? null,
      educationLevel: data.candidateProfile?.currentDegreeLevel ?? null,
      provinceCity: data.candidateProfile?.provinceCity ?? null,
      bio: data.mentorProfile?.bio ?? data.partnerProfile?.description ?? null,
    } : null,
    memberships: data.partnerProfile ? [{ role: "PARTNER", isOwner: true, organization: { id: data.partnerProfile.id, name: data.partnerProfile.companyName ?? "Đối tác", status: data.partnerProfile.approvalStatus ?? "pending" } }] : [],
    candidateApplications: (data.candidateProfile?.applications ?? []).map((application) => ({ ...application, submittedAt: application.createdAt })),
    logs: data.auditLogs ?? [],
  };
}

export function UserDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [roleToAdd, setRoleToAdd] = useState("candidate");
  const [note, setNote] = useState("");
  const query = useQuery({ queryKey: ["admin-user", id], queryFn: async () => {
    const response = await authClient.fetch(`/api/v1/admin/users/${id}`);
    if (!response.ok) throw new Error("Không thể tải người dùng.");
    return normalizeDetail(await response.json() as BackendDetail);
  } });
  const sessions = useQuery({ queryKey: ["admin-user-sessions", id], queryFn: async () => { const response = await authClient.fetch(`/api/v1/admin/users/${id}/sessions`); if (!response.ok) throw new Error("Không thể tải phiên đăng nhập."); return (await response.json() as { items: Session[] }).items; } });
  const notes = useQuery({ queryKey: ["admin-user-notes", id], queryFn: async () => { const response = await authClient.fetch(`/api/v1/admin/users/${id}/notes?page=1&pageSize=100`); if (!response.ok) throw new Error("Không thể tải ghi chú."); return (await response.json() as { items: Note[] }).items; } });
  const action = useMutation({ mutationFn: async (payload: { action: "activate" | "suspend" | "disable" | "add_role" | "remove_role" | "revoke_sessions"; reason?: string; role?: string }) => {
    const response = await authClient.fetch(`/api/v1/admin/users/${id}/actions`, { method: "POST", body: JSON.stringify(payload) });
    if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new Error(body?.message ?? "Không thể thực hiện hành động."); }
  }, onSuccess: async (_, variables) => { toast.success("Đã cập nhật tài khoản."); setReason(""); await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-user", id] }), variables.action === "revoke_sessions" ? queryClient.invalidateQueries({ queryKey: ["admin-user-sessions", id] }) : Promise.resolve()]); }, onError: (error: Error) => toast.error(error.message) });
  const addNote = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch(`/api/v1/admin/users/${id}/notes`, { method: "POST", body: JSON.stringify({ content: note }) });
    if (!response.ok) throw new Error("Không thể lưu ghi chú.");
  }, onSuccess: async () => { toast.success("Đã lưu ghi chú."); setNote(""); await queryClient.invalidateQueries({ queryKey: ["admin-user-notes", id] }); }, onError: (error: Error) => toast.error(error.message) });
  const user = query.data;
  return <div className="mx-auto max-w-[1200px] space-y-4">
    <PageHeader title={user?.profile?.fullName ?? user?.email ?? "Chi tiết người dùng"} description="Dữ liệu xác thực nhạy cảm không bao giờ được trả về giao diện." icon={UserCog} action={<Button asChild variant="outline"><Link href="/admin/users"><ArrowLeft className="h-4 w-4" />Danh sách</Link></Button>} />
    {query.isLoading && <Card><CardContent className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Đang tải thông tin người dùng…</CardContent></Card>}
    {query.isError && <Card><CardContent className="p-6 text-red-600">{query.error.message}</CardContent></Card>}
    {user && <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card><CardHeader><CardTitle>Tổng quan</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Email:</span> {user.email ?? "—"}</p><p><span className="text-muted-foreground">Điện thoại:</span> {user.phone ?? "—"}</p><p className="flex flex-wrap items-center gap-1"><span className="text-muted-foreground">Vai trò:</span> {user.roles.map((role) => <Badge key={role} variant="secondary">{roleLabel(role)}</Badge>)}</p><p><span className="text-muted-foreground">Trạng thái:</span> {statusLabel(user.status)}</p><p><span className="text-muted-foreground">Xác minh email:</span> {user.emailVerified ? "Đã xác minh" : "Chưa xác minh"}</p><p><span className="text-muted-foreground">Đăng nhập cuối:</span> {user.lastLoginAt ? formatDate(user.lastLoginAt, "dd/MM/yyyy HH:mm") : "Chưa đăng nhập"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Hồ sơ</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><p>GPA: {user.profile?.gpa ?? "—"}</p><p>Bậc học: {user.profile?.educationLevel ?? "—"}</p><p>Khu vực: {user.profile?.provinceCity ?? "—"}</p><p className="sm:col-span-2">Giới thiệu: {user.profile?.bio ?? "—"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Đơn ứng tuyển ({user.candidateApplications.length})</CardTitle></CardHeader><CardContent className="divide-y">{user.candidateApplications.length ? user.candidateApplications.map((item) => <Link key={item.id} href={`/admin/applications?selected=${item.id}`} className="flex justify-between gap-3 py-3 text-sm hover:text-primary"><span>{item.scholarship.title}</span><Badge variant="secondary">{item.status}</Badge></Link>) : <p className="py-3 text-sm text-muted-foreground">Người dùng chưa có đơn ứng tuyển.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Tổ chức ({user.memberships.length})</CardTitle></CardHeader><CardContent className="divide-y">{user.memberships.length ? user.memberships.map((item) => <Link key={item.organization.id} href={`/admin/partners/${item.organization.id}`} className="flex justify-between gap-3 py-3 text-sm hover:text-primary"><span>{item.organization.name}</span><span>{roleLabel(item.role)} · {item.organization.status}</span></Link>) : <p className="py-3 text-sm text-muted-foreground">Người dùng không thuộc tổ chức nào.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Nhật ký thao tác</CardTitle></CardHeader><CardContent className="space-y-3">{user.logs.length ? user.logs.map((item) => <div key={item.id} className="border-l border-l-emerald-400 pl-3 text-sm"><p className="font-medium">{actionLabel(item.action)}</p><p className="text-xs text-muted-foreground">{formatDate(item.createdAt, "dd/MM HH:mm")} {item.reason ? `· ${item.reason}` : ""}</p></div>) : <p className="text-sm text-muted-foreground">Chưa có thao tác quản trị.</p>}</CardContent></Card>
      </div>
      <aside className="space-y-4">
        <Card><CardHeader><CardTitle>Quản lý tài khoản</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhập lý do khi khóa, vô hiệu hóa hoặc thay đổi vai trò…" /><div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">Vai trò hiện tại</p><div className="flex flex-wrap gap-1.5">{user.roles.map((role) => <span key={role} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium">{roleLabel(role)}{user.roles.length > 1 && <button type="button" aria-label={`Gỡ vai trò ${roleLabel(role)}`} disabled={!reason.trim() || action.isPending} onClick={() => action.mutate({ action: "remove_role", role: role.toLowerCase(), reason: reason.trim() })}><X className="h-3 w-3" /></button>}</span>)}</div></div><div className="flex gap-2"><Select value={roleToAdd} onValueChange={setRoleToAdd}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["candidate", "partner", "mentor", "admin"].map((value) => <SelectItem key={value} value={value} disabled={user.roles.includes(value.toUpperCase())}>{roleLabel(value)}</SelectItem>)}</SelectContent></Select><Button disabled={!reason.trim() || user.roles.includes(roleToAdd.toUpperCase()) || action.isPending} onClick={() => action.mutate({ action: "add_role", role: roleToAdd, reason: reason.trim() })}>Thêm vai trò</Button></div><Button className="w-full" variant="outline" onClick={() => action.mutate({ action: ["SUSPENDED", "DISABLED"].includes(user.status) ? "activate" : "suspend", reason: reason.trim() || undefined })} disabled={action.isPending || (!["SUSPENDED", "DISABLED"].includes(user.status) && !reason.trim())}><ShieldBan className="h-4 w-4" />{["SUSPENDED", "DISABLED"].includes(user.status) ? "Kích hoạt lại" : "Tạm khóa tài khoản"}</Button><Button className="w-full" variant="outline" disabled={action.isPending} onClick={() => action.mutate({ action: "revoke_sessions" })}><LogOut className="h-4 w-4" />Đăng xuất mọi phiên</Button>{user.status !== "DISABLED" && <Button className="w-full" variant="destructive" disabled={!reason.trim() || action.isPending} onClick={() => action.mutate({ action: "disable", reason: reason.trim() })}><Trash2 className="h-4 w-4" />Vô hiệu hóa tài khoản</Button>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Phiên đăng nhập ({sessions.data?.filter((item) => !item.revokedAt).length ?? 0})</CardTitle></CardHeader><CardContent className="space-y-2">{sessions.isLoading && <p className="text-xs text-muted-foreground">Đang tải phiên đăng nhập…</p>}{sessions.isError && <p className="text-xs text-red-600">{sessions.error.message}</p>}{sessions.data?.length ? sessions.data.map((item) => <div key={item.id} className="rounded-md border p-2 text-xs"><p className="truncate font-medium" title={item.userAgent ?? undefined}>{item.userAgent ?? "Thiết bị không xác định"}</p><p className="mt-1 text-muted-foreground">Tạo {formatDate(item.createdAt, "dd/MM HH:mm")} · {item.revokedAt ? "Đã thu hồi" : `Hết hạn ${formatDate(item.expiresAt, "dd/MM HH:mm")}`}</p></div>) : !sessions.isLoading && !sessions.isError ? <p className="text-xs text-muted-foreground">Không có phiên đăng nhập.</p> : null}</CardContent></Card>
        <Card><CardHeader><CardTitle>Ghi chú nội bộ</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nội dung chỉ dành cho quản trị viên…" /><Button size="sm" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>{addNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Lưu ghi chú</Button>{notes.isError && <p className="text-xs text-red-600">{notes.error.message}</p>}{notes.data?.length ? notes.data.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3 text-sm"><p>{item.content}</p><p className="mt-1 text-xs text-muted-foreground">{item.author?.email ?? "Quản trị viên"} · {formatDate(item.createdAt, "dd/MM HH:mm")}</p></div>) : !notes.isLoading && !notes.isError ? <p className="text-xs text-muted-foreground">Chưa có ghi chú nội bộ.</p> : null}</CardContent></Card>
      </aside>
    </div>}
  </div>;
}

function roleLabel(role: string) { return ({ CANDIDATE: "Ứng viên", PARTNER: "Đối tác", MENTOR: "Mentor", ADMIN: "Quản trị viên" } as Record<string, string>)[role.toUpperCase()] ?? role; }
function statusLabel(status: string) { return ({ ACTIVE: "Đang hoạt động", SUSPENDED: "Tạm khóa", DISABLED: "Đã vô hiệu hóa" } as Record<string, string>)[status] ?? status; }
function actionLabel(action: string) { return ({ "user.activate": "Kích hoạt tài khoản", "user.suspend": "Tạm khóa tài khoản", "user.disable": "Vô hiệu hóa tài khoản", "user.add_role": "Thêm vai trò", "user.remove_role": "Gỡ vai trò", "user.revoke_sessions": "Đăng xuất mọi phiên", "user.note.created": "Thêm ghi chú nội bộ" } as Record<string, string>)[action] ?? action; }

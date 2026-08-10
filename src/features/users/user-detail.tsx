"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut, Mail, ShieldBan, Trash2, UserCog } from "lucide-react";
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
  id: string; email: string | null; phone: string | null; role: string; status: string; emailVerified: boolean; phoneVerified: boolean; lastLoginAt: string | null; createdAt: string;
  profile: { fullName: string | null; gpa: number | null; educationLevel: string | null; country: string | null; bio: string | null } | null;
  memberships: Array<{ role: string; isOwner: boolean; organization: { id: string; name: string; status: string } }>;
  candidateApplications: Array<{ id: string; status: string; submittedAt: string | null; scholarship: { id: string; title: string } }>;
  refreshTokens: Array<{ id: string; createdAt: string; expiresAt: string }>;
  logs: Array<{ id: string; action: string; reason: string | null; createdAt: string }>;
  notes: Array<{ id: string; content: string; createdAt: string }>;
};

export function UserDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [role, setRole] = useState("CANDIDATE");
  const [note, setNote] = useState("");
  const query = useQuery({ queryKey: ["admin-user", id], queryFn: async () => {
    const response = await authClient.fetch(`/api/v1/admin/users/${id}`);
    if (!response.ok) throw new Error("Không thể tải người dùng.");
    const data = await response.json() as Detail;
    setRole(data.role);
    return data;
  } });
  const action = useMutation({ mutationFn: async (payload: { action: string; reason?: string; role?: string }) => {
    const response = await authClient.fetch(`/api/v1/admin/users/${id}/actions`, { method: "POST", body: JSON.stringify(payload) });
    if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new Error(body?.message ?? "Không thể thực hiện hành động."); }
  }, onSuccess: async () => { toast.success("Đã cập nhật tài khoản."); setReason(""); await queryClient.invalidateQueries({ queryKey: ["admin-user", id] }); }, onError: (error: Error) => toast.error(error.message) });
  const addNote = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch(`/api/v1/admin/users/${id}/notes`, { method: "POST", body: JSON.stringify({ content: note }) });
    if (!response.ok) throw new Error("Không thể lưu ghi chú.");
  }, onSuccess: async () => { setNote(""); await queryClient.invalidateQueries({ queryKey: ["admin-user", id] }); } });
  const user = query.data;
  return <div className="mx-auto max-w-[1200px]">
    <PageHeader title={user?.profile?.fullName ?? user?.email ?? "Chi tiết người dùng"} description="Dữ liệu xác thực nhạy cảm không bao giờ được trả về giao diện." icon={UserCog} action={<Button asChild variant="outline"><Link href="/admin/users"><ArrowLeft className="h-4 w-4" />Danh sách</Link></Button>} />
    {query.isError && <Card><CardContent className="p-6 text-red-600">{query.error.message}</CardContent></Card>}
    {user && <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card><CardHeader><CardTitle>Tổng quan</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Email:</span> {user.email ?? "—"}</p><p><span className="text-muted-foreground">Điện thoại:</span> {user.phone ?? "—"}</p><p><span className="text-muted-foreground">Vai trò:</span> <Badge>{user.role}</Badge></p><p><span className="text-muted-foreground">Trạng thái:</span> {user.status}</p><p><span className="text-muted-foreground">Xác minh email:</span> {user.emailVerified ? "Có" : "Chưa"}</p><p><span className="text-muted-foreground">Đăng nhập cuối:</span> {user.lastLoginAt ? formatDate(user.lastLoginAt, "dd/MM/yyyy HH:mm") : "Chưa"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Hồ sơ học tập</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><p>GPA: {user.profile?.gpa ?? "—"}</p><p>Bậc học: {user.profile?.educationLevel ?? "—"}</p><p>Quốc gia: {user.profile?.country ?? "—"}</p><p className="sm:col-span-2">Giới thiệu: {user.profile?.bio ?? "—"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Đơn ứng tuyển ({user.candidateApplications.length})</CardTitle></CardHeader><CardContent className="divide-y">{user.candidateApplications.map((item) => <Link key={item.id} href={`/admin/applications?selected=${item.id}`} className="flex justify-between gap-3 py-3 text-sm hover:text-primary"><span>{item.scholarship.title}</span><Badge variant="secondary">{item.status}</Badge></Link>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Tổ chức ({user.memberships.length})</CardTitle></CardHeader><CardContent className="divide-y">{user.memberships.map((item) => <Link key={item.organization.id} href={`/admin/partners/${item.organization.id}`} className="flex justify-between gap-3 py-3 text-sm hover:text-primary"><span>{item.organization.name}</span><span>{item.role} · {item.organization.status}</span></Link>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Nhật ký</CardTitle></CardHeader><CardContent className="space-y-3">{user.logs.map((item) => <div key={item.id} className="border-l pl-3 text-sm"><p className="font-medium">{item.action}</p><p className="text-xs text-muted-foreground">{formatDate(item.createdAt, "dd/MM HH:mm")} {item.reason ? `· ${item.reason}` : ""}</p></div>)}</CardContent></Card>
      </div>
      <aside className="space-y-4">
        <Card><CardHeader><CardTitle>Hành động an toàn</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do bắt buộc khi khóa/xóa/đổi vai trò..." /><div className="flex gap-2"><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["CANDIDATE", "PARTNER", "SUPPORT", "MODERATOR", "ADMIN", "SUPER_ADMIN"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Button disabled={!reason.trim()} onClick={() => action.mutate({ action: "CHANGE_ROLE", role, reason })}>Đổi vai trò</Button></div><Button className="w-full" variant="outline" onClick={() => action.mutate({ action: user.status === "SUSPENDED" ? "ACTIVATE" : "SUSPEND", reason })} disabled={user.status !== "SUSPENDED" && !reason.trim()}><ShieldBan className="h-4 w-4" />{user.status === "SUSPENDED" ? "Mở khóa" : "Khóa tài khoản"}</Button><Button className="w-full" variant="outline" onClick={() => action.mutate({ action: "FORCE_LOGOUT" })}><LogOut className="h-4 w-4" />Đăng xuất mọi phiên</Button><Button className="w-full" variant="outline" onClick={() => action.mutate({ action: "RESEND_VERIFICATION" })}><Mail className="h-4 w-4" />Gửi lại xác minh</Button><Button className="w-full" variant="outline" onClick={() => action.mutate({ action: "SEND_PASSWORD_RESET" })}>Gửi link đặt lại mật khẩu</Button><Button className="w-full" variant="destructive" disabled={!reason.trim()} onClick={() => action.mutate({ action: "SOFT_DELETE", reason })}><Trash2 className="h-4 w-4" />Xóa mềm</Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Phiên đang mở ({user.refreshTokens.length})</CardTitle></CardHeader><CardContent className="space-y-2">{user.refreshTokens.map((item) => <p key={item.id} className="text-xs text-muted-foreground">{item.id.slice(0, 8)} · hết hạn {formatDate(item.expiresAt, "dd/MM HH:mm")}</p>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Ghi chú nội bộ</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={note} onChange={(event) => setNote(event.target.value)} /><Button size="sm" disabled={!note.trim()} onClick={() => addNote.mutate()}>Lưu ghi chú</Button>{user.notes.map((item) => <div key={item.id} className="rounded-lg bg-muted p-3 text-sm"><p>{item.content}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt, "dd/MM HH:mm")}</p></div>)}</CardContent></Card>
      </aside>
    </div>}
  </div>;
}

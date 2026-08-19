"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Mail, Save, ShieldCheck, Tags, Trash2, UserCog, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/utils";

export function SettingsPage({ section }: { section: "taxonomies" | "emails" | "team" | "profile" }) {
  if (section === "taxonomies") return <Taxonomies />;
  if (section === "emails") return <EmailTemplates />;
  if (section === "team") return <Team />;
  if (section === "profile") return <Profile />;
  return <Profile />;
}

type MajorGroup = { id: number; code: string; name: string; major_count: number };
type Major = { id: number; code: string; name: string; group_id: number; group_name: string };

// Thay UI "Danh mục" chung chung (cây cha-con + gộp tham chiếu — không khớp dữ liệu thật, không endpoint
// nào tồn tại) bằng đúng 2 model thật trong hệ thống: MajorGroup (nhóm ngành) và Major (ngành học), CRUD
// qua module majors/ mới thêm ở Backend-for-admin (/admin/majors, /admin/major-groups).
function Taxonomies() {
  const queryClient = useQueryClient();
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [majorCode, setMajorCode] = useState("");
  const [majorName, setMajorName] = useState("");
  const [majorGroupId, setMajorGroupId] = useState("");

  const groups = useQuery({ queryKey: ["admin-major-groups"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/major-groups");
    if (!response.ok) throw new Error("Không thể tải nhóm ngành.");
    return (await response.json() as { items: MajorGroup[] }).items;
  } });
  const majors = useQuery({ queryKey: ["admin-majors"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/majors");
    if (!response.ok) throw new Error("Không thể tải danh sách ngành.");
    return (await response.json() as { items: Major[] }).items;
  } });

  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin-major-groups"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-majors"] }),
  ]);
  const errorMessage = async (response: Response, fallback: string) => (await response.json().catch(() => null) as { message?: string } | null)?.message ?? fallback;

  const saveGroup = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/major-groups", { method: "POST", body: JSON.stringify({ code: groupCode.trim(), name: groupName.trim() }) });
    if (!response.ok) throw new Error(await errorMessage(response, "Không thể thêm nhóm ngành."));
  }, onSuccess: async () => { setGroupCode(""); setGroupName(""); toast.success("Đã thêm nhóm ngành."); await invalidate(); }, onError: (error: Error) => toast.error(error.message) });
  const removeGroup = useMutation({ mutationFn: async (id: number) => {
    const response = await authClient.fetch(`/api/v1/admin/major-groups/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await errorMessage(response, "Không thể xóa nhóm ngành."));
  }, onSuccess: async () => { toast.success("Đã xóa nhóm ngành."); await invalidate(); }, onError: (error: Error) => toast.error(error.message) });

  const saveMajor = useMutation({ mutationFn: async () => {
    if (!majorGroupId) throw new Error("Hãy chọn nhóm ngành.");
    const response = await authClient.fetch("/api/v1/admin/majors", { method: "POST", body: JSON.stringify({ code: majorCode.trim(), name: majorName.trim(), group_id: Number(majorGroupId) }) });
    if (!response.ok) throw new Error(await errorMessage(response, "Không thể thêm ngành."));
  }, onSuccess: async () => { setMajorCode(""); setMajorName(""); toast.success("Đã thêm ngành học."); await invalidate(); }, onError: (error: Error) => toast.error(error.message) });
  const renameMajor = useMutation({ mutationFn: async ({ id, name }: { id: number; name: string }) => {
    const response = await authClient.fetch(`/api/v1/admin/majors/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
    if (!response.ok) throw new Error(await errorMessage(response, "Không thể cập nhật ngành."));
  }, onSuccess: async () => { toast.success("Đã cập nhật ngành học."); await invalidate(); }, onError: (error: Error) => toast.error(error.message) });
  const removeMajor = useMutation({ mutationFn: async (id: number) => {
    const response = await authClient.fetch(`/api/v1/admin/majors/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await errorMessage(response, "Không thể xóa ngành."));
  }, onSuccess: async () => { toast.success("Đã xóa ngành học."); await invalidate(); }, onError: (error: Error) => toast.error(error.message) });

  const majorColumns: readonly DataTableColumn<Major>[] = [
    { key: "name", header: "Ngành", cell: (item) => <div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.code}</p></div> },
    { key: "group", header: "Nhóm ngành", cell: (item) => <Badge variant="secondary">{item.group_name}</Badge> },
    { key: "action", header: "", cell: (item) => <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => { const nextName = window.prompt("Tên ngành mới", item.name); if (nextName?.trim() && nextName.trim() !== item.name) renameMajor.mutate({ id: item.id, name: nextName.trim() }); }}>Sửa</Button>
      <Button size="icon" variant="ghost" disabled={removeMajor.isPending} onClick={() => removeMajor.mutate(item.id)} title="Xóa"><Trash2 className="h-4 w-4" /></Button>
    </div> },
  ];

  return <div className="mx-auto max-w-[1200px] space-y-4">
    <PageHeader title="Danh mục ngành" description="Nhóm ngành và ngành học dùng chung cho toàn bộ học bổng — đối tác chọn từ danh mục này khi đăng học bổng, ứng viên chọn khi khai ngành mục tiêu." icon={Tags} />
    <Card>
      <CardHeader><CardTitle>Nhóm ngành</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <form className="grid gap-3 sm:grid-cols-[140px_1fr_auto]" onSubmit={(event) => { event.preventDefault(); saveGroup.mutate(); }}>
          <Input value={groupCode} onChange={(event) => setGroupCode(event.target.value)} placeholder="Mã (vd. KT-CN)" />
          <Input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Tên nhóm ngành mới" />
          <Button disabled={!groupCode.trim() || !groupName.trim() || saveGroup.isPending}>Thêm nhóm</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {(groups.data ?? []).map((group) => (
            <span key={group.id} className="inline-flex items-center gap-2 rounded-full border bg-muted/40 py-1 pl-3 pr-1 text-sm">
              {group.name} <span className="text-xs text-muted-foreground">({group.major_count})</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" disabled={group.major_count > 0 || removeGroup.isPending} onClick={() => removeGroup.mutate(group.id)} title={group.major_count > 0 ? `Còn ${group.major_count} ngành, hãy chuyển/xóa hết trước` : "Xóa nhóm"}><Trash2 className="h-3.5 w-3.5" /></Button>
            </span>
          ))}
          {groups.isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
        </div>
      </CardContent>
    </Card>
    <Card className="overflow-hidden">
      <CardHeader><CardTitle>Ngành học</CardTitle></CardHeader>
      <form className="grid gap-3 border-b p-4 sm:grid-cols-[160px_1fr_200px_auto]" onSubmit={(event) => { event.preventDefault(); saveMajor.mutate(); }}>
        <Input value={majorCode} onChange={(event) => setMajorCode(event.target.value)} placeholder="Mã ngành (vd. CNTT)" />
        <Input value={majorName} onChange={(event) => setMajorName(event.target.value)} placeholder="Tên ngành mới" />
        <Select value={majorGroupId || "none"} onValueChange={(value) => setMajorGroupId(value === "none" ? "" : value)}>
          <SelectTrigger><SelectValue placeholder="Chọn nhóm ngành" /></SelectTrigger>
          <SelectContent><SelectItem value="none">Chọn nhóm ngành</SelectItem>{(groups.data ?? []).map((group) => <SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button disabled={!majorCode.trim() || !majorName.trim() || !majorGroupId || saveMajor.isPending}>Thêm ngành</Button>
      </form>
      <DataTable columns={majorColumns} rows={majors.data ?? []} getRowId={(item) => String(item.id)} loading={majors.isLoading} error={majors.error instanceof Error ? majors.error.message : null} />
    </Card>
  </div>;
}

type EmailTemplate = { id: string; key: string; subject: string; content: string; variables: string[]; active: boolean; revisions: Array<{ id: string; createdAt: string }> };
function EmailTemplates() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const query = useQuery({ queryKey: ["admin-email-templates"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/settings/emails");
    if (!response.ok) throw new Error("Không thể tải mẫu email.");
    return response.json() as Promise<EmailTemplate[]>;
  } });
  const columns: readonly DataTableColumn<EmailTemplate>[] = [
    { key: "key", header: "Loại", cell: (item) => <div><p className="font-semibold">{item.key}</p><p className="text-xs text-muted-foreground">{item.subject}</p></div> },
    { key: "active", header: "Hoạt động", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Bật" : "Tắt"}</Badge> },
    { key: "versions", header: "Phiên bản", cell: (item) => item.revisions.length },
    { key: "action", header: "", cell: (item) => <Button size="sm" variant="ghost" onClick={() => setSelected(item)}>Sửa</Button> },
  ];
  return <div className="mx-auto max-w-[1200px]"><PageHeader title="Mẫu email" description="Biến dùng được, xem trước, gửi thử, bật/tắt và lịch sử sửa." icon={Mail} /><Card className="overflow-hidden"><DataTable columns={columns} rows={query.data ?? []} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card>{selected && <EmailEditor item={selected} onClose={() => setSelected(null)} onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-email-templates"] })} />}</div>;
}
function EmailEditor({ item, onClose, onSaved }: { item: EmailTemplate; onClose: () => void; onSaved: () => void }) {
  const [subject, setSubject] = useState(item.subject);
  const [content, setContent] = useState(item.content);
  const [active, setActive] = useState(item.active);
  const [recipient, setRecipient] = useState("");
  const save = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch(`/api/v1/admin/settings/emails/${item.id}`, { method: "PUT", body: JSON.stringify({ subject, content, active }) });
    if (!response.ok) throw new Error("Không thể lưu mẫu.");
  }, onSuccess: () => { toast.success("Đã lưu mẫu và phiên bản lịch sử."); onSaved(); onClose(); }, onError: (error: Error) => toast.error(error.message) });
  const test = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch(`/api/v1/admin/settings/emails/${item.id}/test`, { method: "POST", body: JSON.stringify({ recipient }) });
    if (!response.ok) throw new Error("Gửi thử thất bại.");
  }, onSuccess: () => toast.success("Đã gửi email thử."), onError: (error: Error) => toast.error(error.message) });
  return <Sheet open onOpenChange={(value) => !value && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetTitle>{item.key}</SheetTitle><SheetDescription>Biến: {item.variables.join(", ") || "Không có"}</SheetDescription><div className="grid gap-4 py-5"><Input value={subject} onChange={(event) => setSubject(event.target.value)} /><Textarea rows={12} value={content} onChange={(event) => setContent(event.target.value)} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Đang bật</label><div className="rounded-lg border p-4"><p className="mb-2 font-semibold">{subject}</p><div dangerouslySetInnerHTML={{ __html: content }} /></div><div className="flex gap-2"><Input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Email nhận thử" /><Button variant="outline" disabled={!recipient || test.isPending} onClick={() => test.mutate()}>Gửi thử</Button></div><Button disabled={!subject || !content || save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" />Lưu mẫu</Button></div></SheetContent></Sheet>;
}

type TeamUser = { id: string; email: string | null; role: string; status: string; lastLoginAt: string | null; createdAt: string; profile: { fullName: string | null } | null };
function Team() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SUPPORT");
  const query = useQuery({ queryKey: ["admin-team"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/settings/team");
    if (!response.ok) throw new Error(response.status === 403 ? "Chỉ SUPER_ADMIN được xem đội ngũ." : "Không thể tải đội ngũ.");
    return response.json() as Promise<TeamUser[]>;
  } });
  const invite = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/settings/team", { method: "POST", body: JSON.stringify({ email, role }) });
    if (!response.ok) throw new Error((await response.json().catch(() => null) as { message?: string } | null)?.message ?? "Không thể mời thành viên.");
  }, onSuccess: async () => { setEmail(""); toast.success("Đã tạo tài khoản và gửi lời mời."); await queryClient.invalidateQueries({ queryKey: ["admin-team"] }); }, onError: (error: Error) => toast.error(error.message) });
  const updateRole = useMutation({ mutationFn: async ({ id, nextRole }: { id: string; nextRole: string }) => {
    const response = await authClient.fetch(`/api/v1/admin/settings/team/${id}`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) });
    if (!response.ok) throw new Error((await response.json().catch(() => null) as { message?: string } | null)?.message ?? "Không thể đổi vai trò.");
  }, onSuccess: async () => { toast.success("Đã đổi vai trò."); await queryClient.invalidateQueries({ queryKey: ["admin-team"] }); }, onError: (error: Error) => toast.error(error.message) });
  const revoke = useMutation({ mutationFn: async (id: string) => {
    const response = await authClient.fetch(`/api/v1/admin/settings/team/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error((await response.json().catch(() => null) as { message?: string } | null)?.message ?? "Không thể thu hồi quyền.");
  }, onSuccess: async () => { toast.success("Đã thu hồi quyền và toàn bộ phiên."); await queryClient.invalidateQueries({ queryKey: ["admin-team"] }); }, onError: (error: Error) => toast.error(error.message) });
  const columns: readonly DataTableColumn<TeamUser>[] = [
    { key: "account", header: "Tài khoản", cell: (item) => <div><p className="font-semibold">{item.profile?.fullName ?? item.email}</p><p className="text-xs text-muted-foreground">{item.email}</p></div> },
    { key: "role", header: "Vai trò", cell: (item) => <Select value={item.role} onValueChange={(nextRole) => updateRole.mutate({ id: item.id, nextRole })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["SUPPORT", "MODERATOR", "ADMIN", "SUPER_ADMIN"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select> },
    { key: "status", header: "Trạng thái", cell: (item) => <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge> },
    { key: "last", header: "Hoạt động cuối", cell: (item) => item.lastLoginAt ? formatDate(item.lastLoginAt, "dd/MM/yyyy HH:mm") : "Chưa đăng nhập" },
    { key: "action", header: "", cell: (item) => <Button variant="destructive" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate(item.id)}>Thu hồi</Button> },
  ];
  return <div className="mx-auto max-w-[1200px]"><PageHeader title="Đội ngũ quản trị" description="Mời qua email, gán vai trò, thu hồi quyền và xem ma trận quyền." icon={Users} /><div className="space-y-4"><Card><CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_200px_auto]"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email quản trị mới" /><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["SUPPORT", "MODERATOR", "ADMIN"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Button disabled={!email || invite.isPending} onClick={() => invite.mutate()}>Mời thành viên</Button></CardContent></Card><Card className="overflow-hidden"><DataTable columns={columns} rows={query.data ?? []} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card><Card><CardHeader><CardTitle>Ma trận quyền</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Vai trò</th><th className="p-2">Phạm vi chính</th></tr></thead><tbody>{[["SUPPORT", "Dashboard, user đọc, hồ sơ đọc, tư vấn, thông báo"], ["MODERATOR", "Dashboard, học bổng, KYC"], ["ADMIN", "Toàn bộ vận hành trừ quản lý đội ngũ"], ["SUPER_ADMIN", "Tất cả quyền, bao gồm đội ngũ và xóa vĩnh viễn"]].map(([name, scope]) => <tr key={name} className="border-b"><td className="p-2 font-semibold">{name}</td><td className="p-2 text-muted-foreground">{scope}</td></tr>)}</tbody></table></CardContent></Card></div></div>;
}

type AdminProfile = { id: string; email: string | null; phone: string | null; role: string; status: string; totpEnabled: boolean; lastLoginAt: string | null; profile: { fullName: string | null } | null; refreshTokens: Array<{ id: string; createdAt: string; expiresAt: string }> };
type TotpSetup = { secret: string; otpauthUrl: string; qrCodeDataUrl: string };
function Profile() {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const query = useQuery({ queryKey: ["admin-profile"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/settings/profile");
    if (!response.ok) throw new Error("Không thể tải tài khoản.");
    return response.json() as Promise<AdminProfile>;
  } });
  const revoke = useMutation({ mutationFn: async (id: string) => {
    const response = await authClient.fetch(`/api/v1/admin/settings/profile/sessions/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Không thể thu hồi phiên.");
  }, onSuccess: async () => { toast.success("Đã thu hồi phiên."); await queryClient.invalidateQueries({ queryKey: ["admin-profile"] }); } });
  const password = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/settings/profile/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
    if (!response.ok) throw new Error((await response.json().catch(() => null) as { message?: string } | null)?.message ?? "Không thể đổi mật khẩu.");
  }, onSuccess: () => { toast.success("Đã đổi mật khẩu. Hãy đăng nhập lại."); void authClient.logout().finally(() => { window.location.href = "/login"; }); }, onError: (error: Error) => toast.error(error.message) });
  const beginTotp = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/settings/profile/2fa/setup", { method: "POST" });
    if (!response.ok) throw new Error("Không thể tạo cấu hình 2FA.");
    return response.json() as Promise<TotpSetup>;
  }, onSuccess: setSetup, onError: (error: Error) => toast.error(error.message) });
  const verifyTotp = useMutation({ mutationFn: async (disable: boolean) => {
    const response = await authClient.fetch("/api/v1/admin/settings/profile/2fa" + (disable ? "" : "/enable"), { method: disable ? "DELETE" : "POST", body: JSON.stringify({ token: totpToken }) });
    if (!response.ok) throw new Error((await response.json().catch(() => null) as { message?: string } | null)?.message ?? "Mã 2FA không đúng.");
  }, onSuccess: async () => { setSetup(null); setTotpToken(""); toast.success("Đã cập nhật xác thực hai lớp."); await queryClient.invalidateQueries({ queryKey: ["admin-profile"] }); }, onError: (error: Error) => toast.error(error.message) });
  return <div className="mx-auto max-w-3xl"><PageHeader title="Tài khoản quản trị" description="Đổi mật khẩu, xác thực hai lớp, phiên đang mở và lịch sử đăng nhập." icon={UserCog} /><div className="space-y-4"><Card><CardContent className="p-6"><h2 className="text-xl font-bold">{query.data?.profile?.fullName ?? query.data?.email ?? "Đang tải..."}</h2><p className="mt-1 text-sm text-muted-foreground">{query.data?.email} · {query.data?.role} · {query.data?.status}</p><Badge className="mt-3" variant={query.data?.totpEnabled ? "default" : "secondary"}>{query.data?.totpEnabled ? "2FA đang bật" : "2FA chưa bật"}</Badge></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Đổi mật khẩu</CardTitle></CardHeader><CardContent className="grid gap-3"><Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Mật khẩu hiện tại" /><Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mật khẩu mới: ít nhất 12 ký tự, đủ hoa/thường/số/ký hiệu" /><Button disabled={!currentPassword || newPassword.length < 12 || password.isPending} onClick={() => password.mutate()}>Đổi mật khẩu và đăng xuất mọi phiên</Button></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Xác thực hai lớp (TOTP)</CardTitle></CardHeader><CardContent className="space-y-3">{!query.data?.totpEnabled && !setup && <Button variant="outline" onClick={() => beginTotp.mutate()}>Thiết lập ứng dụng xác thực</Button>}{setup && <div className="space-y-3 rounded-lg border p-4"><img src={setup.qrCodeDataUrl} width={180} height={180} alt="Mã QR thiết lập 2FA" /><p className="break-all text-xs text-muted-foreground">Khóa thủ công: {setup.secret}</p></div>}<div className="flex gap-2"><Input inputMode="numeric" maxLength={6} value={totpToken} onChange={(event) => setTotpToken(event.target.value.replace(/\D/g, ""))} placeholder="Mã 6 chữ số" /><Button disabled={totpToken.length !== 6 || verifyTotp.isPending} onClick={() => verifyTotp.mutate(Boolean(query.data?.totpEnabled))}>{query.data?.totpEnabled ? "Tắt 2FA" : "Xác nhận bật 2FA"}</Button></div></CardContent></Card><Card><CardHeader><CardTitle>Phiên đang mở</CardTitle></CardHeader><CardContent className="divide-y">{query.data?.refreshTokens.map((session) => <div key={session.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium">Phiên {session.id.slice(0, 8)}</p><p className="text-xs text-muted-foreground">Tạo {formatDate(session.createdAt, "dd/MM HH:mm")} · Hết hạn {formatDate(session.expiresAt, "dd/MM HH:mm")}</p></div><Button variant="outline" size="sm" onClick={() => revoke.mutate(session.id)}>Thu hồi</Button></div>)}</CardContent></Card></div></div>;
}

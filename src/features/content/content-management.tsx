"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, GraduationCap, GripVertical, Image, LayoutTemplate, Plus, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { formatDate } from "@/lib/utils";

type ContentStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
type PostRow = { id: string; title: string; slug: string; status: ContentStatus; category: string | null; scheduledAt: string | null; publishedAt: string | null; viewCount: number; updatedAt: string };
type PostDetail = PostRow & { excerpt: string | null; content: string; coverImage: string | null; tags: string[]; seoTitle: string | null; seoDescription: string | null };
type BannerRow = { id: string; title: string; desktopUrl: string; mobileUrl: string | null; linkUrl: string | null; sortOrder: number; active: boolean; startsAt: string | null; endsAt: string | null };
type StaticPage = { id: string; key: string; title: string; content: string; status: ContentStatus; updatedAt: string };

export function ContentManagement({ section }: { section: "posts" | "banners" | "pages" | "featured" }) {
  if (section === "posts") return <Posts />;
  if (section === "banners") return <Banners />;
  if (section === "featured") return <Featured />;
  return <Pages />;
}

function Posts() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const list = useQuery({
    queryKey: ["admin-content-posts"],
    queryFn: async () => {
      const response = await authClient.fetch("/api/v1/admin/content/posts?pageSize=100");
      if (!response.ok) throw new Error("Không thể tải bài viết.");
      return response.json() as Promise<{ items: PostRow[] }>;
    },
  });
  const detail = useQuery({
    queryKey: ["admin-content-post", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/content/posts/${selectedId}`);
      if (!response.ok) throw new Error("Không thể tải bài viết.");
      return response.json() as Promise<PostDetail>;
    },
  });
  const columns: readonly DataTableColumn<PostRow>[] = [
    { key: "title", header: "Bài viết", cell: (item) => <button className="text-left" onClick={() => setSelectedId(item.id)}><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">/{item.slug}</p></button> },
    { key: "status", header: "Trạng thái", cell: (item) => <Badge variant="secondary">{item.status}</Badge> },
    { key: "category", header: "Danh mục", cell: (item) => item.category ?? "—" },
    { key: "views", header: "Lượt xem", cell: (item) => item.viewCount },
    { key: "updatedAt", header: "Cập nhật", cell: (item) => formatDate(item.updatedAt, "dd/MM/yyyy HH:mm") },
    { key: "action", header: "", cell: (item) => <Button size="sm" variant="ghost" onClick={() => setSelectedId(item.id)}>Sửa</Button> },
  ];
  return <div className="mx-auto max-w-[1440px]">
    <PageHeader title="Bài viết CMS" description="Soạn nội dung, tự lưu phiên bản, xem trước, xuất bản và hẹn giờ." icon={FileText} action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Bài viết</Button>} />
    <Card className="overflow-hidden"><DataTable columns={columns} rows={list.data?.items ?? []} getRowId={(item) => item.id} loading={list.isLoading} error={list.error instanceof Error ? list.error.message : null} /></Card>
    <PostEditor post={creating ? null : detail.data ?? undefined} open={creating || Boolean(selectedId)} onClose={() => { setCreating(false); setSelectedId(null); }} onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-content-posts"] })} />
  </div>;
}

function PostEditor({ post, open, onClose, onSaved }: { post: PostDetail | null | undefined; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Partial<PostDetail>>({});
  const source = { title: "", slug: "", excerpt: "", content: "", coverImage: "", tags: [] as string[], category: "", status: "DRAFT" as ContentStatus, seoTitle: "", seoDescription: "", ...post, ...draft };
  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...source, tags: source.tags ?? [] };
      const response = await authClient.fetch(post ? `/api/v1/admin/content/posts/${post.id}` : "/api/v1/admin/content/posts", { method: post ? "PUT" : "POST", body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Không thể lưu bài viết.");
    },
    onSuccess: () => { toast.success("Đã lưu bài viết và phiên bản."); onSaved(); onClose(); setDraft({}); },
    onError: (error: Error) => toast.error(error.message),
  });
  const set = (key: keyof PostDetail, value: unknown) => setDraft((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!post?.id || Object.keys(draft).length === 0) return;
    const autoSource = { ...post, ...draft };
    if (autoSource.status !== "DRAFT") return;
    const timer = window.setTimeout(() => {
      void authClient.fetch(`/api/v1/admin/content/posts/${post.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...autoSource, tags: autoSource.tags ?? [] }),
      }).then((response) => {
        if (response.ok) toast.success("Đã tự lưu bản nháp.");
      });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [draft, post]);
  return <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
      <SheetTitle>{post ? "Chỉnh sửa bài viết" : "Tạo bài viết"}</SheetTitle>
      <SheetDescription>Mỗi lần lưu tạo một phiên bản lịch sử trước khi cập nhật.</SheetDescription>
      <div className="grid gap-4 py-5">
        <Input value={source.title} onChange={(event) => set("title", event.target.value)} placeholder="Tiêu đề" />
        <div className="grid gap-3 sm:grid-cols-2"><Input value={source.slug} onChange={(event) => set("slug", event.target.value)} placeholder="slug-tu-dong-neu-bo-trong" /><Input value={source.category ?? ""} onChange={(event) => set("category", event.target.value)} placeholder="Danh mục" /></div>
        <Textarea value={source.excerpt ?? ""} onChange={(event) => set("excerpt", event.target.value)} placeholder="Tóm tắt" />
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><Input value={source.coverImage ?? ""} onChange={(event) => set("coverImage", event.target.value)} placeholder="URL ảnh bìa" /><Select value={source.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        {source.status === "SCHEDULED" && <Input type="datetime-local" value={source.scheduledAt ? source.scheduledAt.slice(0, 16) : ""} onChange={(event) => set("scheduledAt", event.target.value ? new Date(event.target.value).toISOString() : null)} />}
        <RichTextEditor value={source.content} onChange={(value) => set("content", value)} />
        <Input value={(source.tags ?? []).join(", ")} onChange={(event) => set("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Tags, phân cách bằng dấu phẩy" />
        <div className="grid gap-3 sm:grid-cols-2"><Input value={source.seoTitle ?? ""} onChange={(event) => set("seoTitle", event.target.value)} placeholder="SEO title" /><Input value={source.seoDescription ?? ""} onChange={(event) => set("seoDescription", event.target.value)} placeholder="SEO description" /></div>
        <div className="rounded-lg border bg-muted/30 p-5"><p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Xem trước</p><h1 className="text-2xl font-bold">{source.title || "Tiêu đề bài viết"}</h1><p className="mt-2 text-sm text-muted-foreground">{source.excerpt}</p><div className="prose mt-5 max-w-none text-sm" dangerouslySetInnerHTML={{ __html: source.content }} /></div>
        <Button disabled={source.title.trim().length < 3 || !source.content.trim() || save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" />Lưu nội dung</Button>
      </div>
    </SheetContent>
  </Sheet>;
}

function Banners() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<BannerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin-banners"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/content/banners");
    if (!response.ok) throw new Error("Không thể tải banner.");
    return response.json() as Promise<BannerRow[]>;
  } });
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await authClient.fetch("/api/v1/admin/content/banners/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Không thể sắp xếp banner.");
    },
    onSuccess: async () => {
      toast.success("Đã lưu thứ tự banner.");
      await queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const columns: readonly DataTableColumn<BannerRow>[] = [
    { key: "order", header: "#", cell: (item) => item.sortOrder },
    { key: "title", header: "Banner", cell: (item) => <div><p className="font-semibold">{item.title}</p><p className="max-w-[420px] truncate text-xs text-muted-foreground">{item.desktopUrl}</p></div> },
    { key: "active", header: "Hiển thị", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Bật" : "Tắt"}</Badge> },
    { key: "period", header: "Thời gian", cell: (item) => `${item.startsAt ? formatDate(item.startsAt) : "Ngay"} → ${item.endsAt ? formatDate(item.endsAt) : "Không hạn"}` },
    { key: "action", header: "", cell: (item) => <Button variant="ghost" size="sm" onClick={() => setSelected(item)}>Sửa</Button> },
  ];
  const ordered = [...(query.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  return <div className="mx-auto max-w-[1440px]"><PageHeader title="Banner trang chủ" description="Kéo-thả để đổi thứ tự; cấu hình ảnh desktop/mobile, lịch hiển thị và bật/tắt." icon={Image} action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Banner</Button>} /><Card className="mb-4 p-3"><p className="mb-3 text-sm font-semibold">Thứ tự hiển thị</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{ordered.map((item) => <button key={item.id} type="button" draggable onDragStart={() => setDraggedId(item.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!draggedId || draggedId === item.id) return; reorder.mutate(reorderIds(ordered, draggedId, item.id)); setDraggedId(null); }} className={`flex items-center gap-2 rounded-lg border bg-background p-3 text-left text-sm transition ${draggedId === item.id ? "opacity-50" : "hover:border-primary/50"}`}><GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{item.title}</span></button>)}</div></Card><Card className="overflow-hidden"><DataTable columns={columns} rows={ordered} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card><BannerEditor item={selected} open={creating || Boolean(selected)} onClose={() => { setCreating(false); setSelected(null); }} onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-banners"] })} /></div>;
}

function BannerEditor({ item, open, onClose, onSaved }: { item: BannerRow | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Partial<BannerRow>>({});
  const source = { title: "", desktopUrl: "", mobileUrl: "", linkUrl: "", sortOrder: 0, active: true, startsAt: "", endsAt: "", ...item, ...draft };
  const save = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch(item ? `/api/v1/admin/content/banners/${item.id}` : "/api/v1/admin/content/banners", { method: item ? "PUT" : "POST", body: JSON.stringify(source) });
    if (!response.ok) throw new Error("Không thể lưu banner.");
  }, onSuccess: () => { toast.success("Đã lưu banner."); onSaved(); onClose(); setDraft({}); }, onError: (error: Error) => toast.error(error.message) });
  const set = (key: keyof BannerRow, value: unknown) => setDraft((current) => ({ ...current, [key]: value }));
  return <Sheet open={open} onOpenChange={(value) => !value && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetTitle>{item ? "Sửa banner" : "Thêm banner"}</SheetTitle><SheetDescription>Xem trước ảnh, đặt thứ tự và lịch hiển thị.</SheetDescription><div className="grid gap-4 py-5"><Input value={source.title} onChange={(event) => set("title", event.target.value)} placeholder="Tên banner" /><Input value={source.desktopUrl} onChange={(event) => set("desktopUrl", event.target.value)} placeholder="URL ảnh desktop" /><Input value={source.mobileUrl ?? ""} onChange={(event) => set("mobileUrl", event.target.value)} placeholder="URL ảnh mobile" /><Input value={source.linkUrl ?? ""} onChange={(event) => set("linkUrl", event.target.value)} placeholder="Liên kết" /><div className="grid gap-3 sm:grid-cols-3"><Input type="number" value={source.sortOrder} onChange={(event) => set("sortOrder", Number(event.target.value))} title="Thứ tự" /><Input type="datetime-local" value={source.startsAt ? source.startsAt.slice(0, 16) : ""} onChange={(event) => set("startsAt", event.target.value ? new Date(event.target.value).toISOString() : null)} title="Bắt đầu" /><Input type="datetime-local" value={source.endsAt ? source.endsAt.slice(0, 16) : ""} onChange={(event) => set("endsAt", event.target.value ? new Date(event.target.value).toISOString() : null)} title="Kết thúc" /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={source.active} onChange={(event) => set("active", event.target.checked)} /> Đang bật</label>{source.desktopUrl && <img src={source.desktopUrl} alt="" className="max-h-56 w-full rounded-lg border object-cover" />}<Button disabled={!source.title || !source.desktopUrl || save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" />Lưu banner</Button></div></SheetContent></Sheet>;
}

function Pages() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<StaticPage | null>(null);
  const query = useQuery({ queryKey: ["admin-static-pages"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/content/pages");
    if (!response.ok) throw new Error("Không thể tải trang tĩnh.");
    return response.json() as Promise<StaticPage[]>;
  } });
  const columns: readonly DataTableColumn<StaticPage>[] = [
    { key: "title", header: "Trang", cell: (item) => <div><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.key}</p></div> },
    { key: "status", header: "Trạng thái", cell: (item) => <Badge variant="secondary">{item.status}</Badge> },
    { key: "updatedAt", header: "Cập nhật", cell: (item) => formatDate(item.updatedAt, "dd/MM/yyyy HH:mm") },
    { key: "action", header: "", cell: (item) => <Button size="sm" variant="ghost" onClick={() => setSelected(item)}>Sửa</Button> },
  ];
  return <div className="mx-auto max-w-[1440px]"><PageHeader title="Trang tĩnh" description="Giới thiệu, liên hệ, FAQ, điều khoản và bảo mật không còn hardcode." icon={LayoutTemplate} /><Card className="overflow-hidden"><DataTable columns={columns} rows={query.data ?? []} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card>{selected && <PageEditor item={selected} onClose={() => setSelected(null)} onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-static-pages"] })} />}</div>;
}

function PageEditor({ item, onClose, onSaved }: { item: StaticPage; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [status, setStatus] = useState(item.status);
  const save = useMutation({ mutationFn: async () => {
    const response = await authClient.fetch(`/api/v1/admin/content/pages/${item.key}`, { method: "PUT", body: JSON.stringify({ key: item.key, title, content, status }) });
    if (!response.ok) throw new Error("Không thể lưu trang.");
  }, onSuccess: () => { toast.success("Đã lưu trang tĩnh."); onSaved(); onClose(); }, onError: (error: Error) => toast.error(error.message) });
  return <Sheet open onOpenChange={(value) => !value && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetTitle>Sửa {item.title}</SheetTitle><SheetDescription>Nội dung HTML được xem trước phía dưới.</SheetDescription><div className="grid gap-4 py-5"><Input value={title} onChange={(event) => setTitle(event.target.value)} /><Select value={status} onValueChange={(value) => setStatus(value as ContentStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DRAFT", "PUBLISHED", "ARCHIVED"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Textarea rows={15} value={content} onChange={(event) => setContent(event.target.value)} /><div className="rounded-lg border p-5" dangerouslySetInnerHTML={{ __html: content }} /><Button disabled={!title || save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" />Lưu trang</Button></div></SheetContent></Sheet>;
}

type FeaturedRow = { id: string; title: string; isFeatured: boolean; featuredOrder: number; viewCount: number; organization: { name: string }; _count: { applications: number } };
function Featured() {
  const queryClient = useQueryClient();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin-featured-scholarships"], queryFn: async () => {
    const response = await authClient.fetch("/api/v1/admin/scholarships?status=PUBLISHED&pageSize=100");
    if (!response.ok) throw new Error("Không thể tải học bổng.");
    return ((await response.json()) as { items: FeaturedRow[] }).items;
  } });
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await authClient.fetch("/api/v1/admin/content/featured/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Không thể sắp xếp học bổng nổi bật.");
    },
    onSuccess: async () => {
      toast.success("Đã lưu thứ tự học bổng nổi bật.");
      await queryClient.invalidateQueries({ queryKey: ["admin-featured-scholarships"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const toggle = useMutation({ mutationFn: async (item: FeaturedRow) => {
    const response = await authClient.fetch(`/api/v1/admin/scholarships/${item.id}`, { method: "PATCH", body: JSON.stringify({ isFeatured: !item.isFeatured, reason: "Sắp xếp nội dung nổi bật" }) });
    if (!response.ok) throw new Error("Không thể cập nhật nội dung nổi bật.");
  }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-featured-scholarships"] }); } });
  const columns: readonly DataTableColumn<FeaturedRow>[] = [
    { key: "title", header: "Học bổng", cell: (item) => <div><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.organization.name}</p></div> },
    { key: "views", header: "Lượt xem", cell: (item) => item.viewCount },
    { key: "applications", header: "Hồ sơ", cell: (item) => item._count.applications },
    { key: "featured", header: "Nổi bật", cell: (item) => <Button variant={item.isFeatured ? "default" : "outline"} size="sm" onClick={() => toggle.mutate(item)}>{item.isFeatured ? "Đang nổi bật" : "Thêm nổi bật"}</Button> },
  ];
  const featured = [...(query.data ?? [])].filter((item) => item.isFeatured).sort((a, b) => a.featuredOrder - b.featuredOrder);
  return <div className="mx-auto max-w-[1200px]"><PageHeader title="Học bổng nổi bật" description="Chọn học bổng đã xuất bản và kéo-thả để ưu tiên trên trang chủ." icon={GraduationCap} /><Card className="mb-4 p-3"><p className="mb-3 text-sm font-semibold">Thứ tự nổi bật</p>{featured.length ? <div className="grid gap-2 sm:grid-cols-2">{featured.map((item) => <button key={item.id} type="button" draggable onDragStart={() => setDraggedId(item.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!draggedId || draggedId === item.id) return; reorder.mutate(reorderIds(featured, draggedId, item.id)); setDraggedId(null); }} className={`flex items-center gap-2 rounded-lg border bg-background p-3 text-left text-sm transition ${draggedId === item.id ? "opacity-50" : "hover:border-primary/50"}`}><GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{item.title}</span></button>)}</div> : <p className="text-sm text-muted-foreground">Chưa có học bổng nổi bật.</p>}</Card><Card className="overflow-hidden"><DataTable columns={columns} rows={query.data ?? []} getRowId={(item) => item.id} loading={query.isLoading} error={query.error instanceof Error ? query.error.message : null} /></Card></div>;
}

function reorderIds<T extends { id: string }>(items: T[], draggedId: string, targetId: string) {
  const next = [...items];
  const from = next.findIndex((item) => item.id === draggedId);
  const to = next.findIndex((item) => item.id === targetId);
  if (from < 0 || to < 0) return next.map((item) => item.id);
  const [dragged] = next.splice(from, 1);
  next.splice(to, 0, dragged);
  return next.map((item) => item.id);
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && document.activeElement !== editor && editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);
  const command = (name: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? "");
  };
  const createLink = () => {
    const url = window.prompt("URL liên kết");
    if (url) command("createLink", url);
  };
  const insertImage = () => {
    const url = window.prompt("URL ảnh");
    if (url) command("insertImage", url);
  };
  return <div className="overflow-hidden rounded-lg border">
    <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
      <Button type="button" size="sm" variant="ghost" onClick={() => command("bold")}>Đậm</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => command("italic")}>Nghiêng</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => command("formatBlock", "h2")}>Tiêu đề</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => command("insertUnorderedList")}>Danh sách</Button>
      <Button type="button" size="sm" variant="ghost" onClick={createLink}>Liên kết</Button>
      <Button type="button" size="sm" variant="ghost" onClick={insertImage}>Ảnh</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => command("formatBlock", "blockquote")}>Trích dẫn</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => command("formatBlock", "pre")}>Mã</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => command("removeFormat")}>Xóa định dạng</Button>
    </div>
    <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={(event) => onChange(event.currentTarget.innerHTML)} className="prose min-h-72 max-w-none bg-background p-4 text-sm focus:outline-none" data-placeholder="Nhập nội dung bài viết..." />
  </div>;
}

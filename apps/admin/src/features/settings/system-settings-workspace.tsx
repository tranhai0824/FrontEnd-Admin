"use client";

import {
  getSystemSettingDefinitions,
  validateSystemSettingValue,
  type SystemSettingDefinition,
  type SystemSettingGroup,
  type SystemSettingValue,
} from "@scholarship/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Mail,
  Save,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { PacmanLoader } from "@/components/shared/pacman-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { getSettingsSection, SETTINGS_SECTIONS } from "@/features/settings/settings-sections";
import { cn } from "@/lib/utils";

type SettingsResponse = {
  values: Record<string, SystemSettingValue>;
  secretConfigured: Record<string, boolean>;
  updatedAt: Record<string, string | null>;
};

type ValidationErrors = Record<string, string>;

export function SettingsHub() {
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Cấu hình nền tảng"
        description="Trung tâm cấu hình vận hành TopScholar. Mỗi thay đổi được kiểm tra kiểu dữ liệu và ghi AuditLog."
        icon={Settings2}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SETTINGS_SECTIONS.map((group) => {
          const Icon = group.icon;
          return (
            <Link key={group.id} href={`/admin/settings/${group.id}`} className="group">
              <Card className="h-full transition-colors hover:bg-slate-50 dark:hover:bg-muted/30">
                <CardContent className="flex h-full items-start gap-4 p-5">
                  <div className="rounded-md bg-slate-100 p-3 text-muted-foreground dark:bg-muted"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold">{group.label}</h2>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{group.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SystemSettingsWorkspace({ group, embedded = false }: { group: SystemSettingGroup; embedded?: boolean }) {
  const queryClient = useQueryClient();
  const groupMeta = getSettingsSection(group);
  const definitions = useMemo(() => getSystemSettingDefinitions(group), [group]);
  const [draft, setDraft] = useState<Record<string, SystemSettingValue>>({});
  const [rawJson, setRawJson] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [clearSecrets, setClearSecrets] = useState<string[]>([]);
  const [testRecipient, setTestRecipient] = useState("");
  const Icon = groupMeta.icon;

  const query = useQuery({
    queryKey: ["admin-system-settings", group],
    queryFn: async () => {
      const response = await authClient.fetch(`/api/v1/admin/settings/system?group=${group}`);
      if (!response.ok) throw new Error("Không thể tải cấu hình.");
      return response.json() as Promise<SettingsResponse>;
    },
  });

  const values = { ...(query.data?.values ?? {}), ...draft };
  const dirtyCount = Object.keys(draft).length + clearSecrets.length;

  const save = useMutation({
    mutationFn: async () => {
      if (Object.keys(errors).length > 0) throw new Error("Hãy sửa các trường không hợp lệ trước khi lưu.");
      const response = await authClient.fetch("/api/v1/admin/settings/system", {
        method: "PUT",
        body: JSON.stringify({ values: draft, clearSecrets }),
      });
      const payload = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string> } | null;
      if (!response.ok) {
        if (payload?.errors) setErrors(payload.errors);
        throw new Error(payload?.message ?? "Không thể lưu cấu hình.");
      }
    },
    onSuccess: async () => {
      setDraft({});
      setRawJson({});
      setErrors({});
      setClearSecrets([]);
      toast.success("Đã lưu cấu hình và ghi nhật ký thao tác.");
      await queryClient.invalidateQueries({ queryKey: ["admin-system-settings", group] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const testEmail = useMutation({
    mutationFn: async () => {
      const response = await authClient.fetch("/api/v1/admin/settings/system/test-email", {
        method: "POST",
        body: JSON.stringify({ recipient: testRecipient }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "Gửi email kiểm tra thất bại.");
    },
    onSuccess: () => toast.success("Đã gửi email kiểm tra."),
    onError: (error: Error) => toast.error(error.message),
  });

  const setValue = (definition: SystemSettingDefinition, value: SystemSettingValue) => {
    const error = validateSystemSettingValue(definition, value);
    setErrors((current) => {
      const next = { ...current };
      if (error) next[definition.key] = error;
      else delete next[definition.key];
      return next;
    });
    setDraft((current) => ({ ...current, [definition.key]: value }));
    if (definition.secret) setClearSecrets((current) => current.filter((key) => key !== definition.key));
  };

  const setJson = (definition: SystemSettingDefinition, text: string) => {
    setRawJson((current) => ({ ...current, [definition.key]: text }));
    try {
      const parsed = JSON.parse(text) as SystemSettingValue;
      setValue(definition, parsed);
    } catch {
      setErrors((current) => ({ ...current, [definition.key]: "JSON không hợp lệ" }));
    }
  };

  const settingsContent = query.isLoading ? (
    <PacmanLoader className="min-h-[420px]" label="Đang tải cấu hình…" />
  ) : query.error ? (
    <div className="p-5 md:p-6">
      <Card className="border-destructive/40 shadow-none"><CardContent className="p-8 text-sm text-destructive">{query.error.message}</CardContent></Card>
    </div>
  ) : (
    <div className="space-y-4 p-5 md:p-6">
      {(["P0", "P1", "P2"] as const).map((priority) => {
        const items = definitions.filter((item) => item.priority === priority);
        if (items.length === 0) return null;
        return (
          <Card key={priority} className={cn(embedded && "shadow-none")}>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-3 text-base">
                <PriorityBadge priority={priority} />
                {priority === "P0" ? "Thiết yếu trước go-live" : priority === "P1" ? "Vận hành nâng cao" : "Khung mở rộng"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-5 p-6 xl:grid-cols-2">
              {items.map((definition) => (
                <SettingField
                  key={definition.key}
                  definition={definition}
                  value={values[definition.key] ?? definition.defaultValue}
                  rawJson={rawJson[definition.key]}
                  error={errors[definition.key]}
                  secretConfigured={query.data?.secretConfigured[definition.key] ?? false}
                  clearPending={clearSecrets.includes(definition.key)}
                  onChange={(value) => setValue(definition, value)}
                  onJsonChange={(value) => setJson(definition, value)}
                  onClearSecret={() => {
                    setDraft((current) => {
                      const next = { ...current };
                      delete next[definition.key];
                      return next;
                    });
                    setClearSecrets((current) => current.includes(definition.key)
                      ? current.filter((key) => key !== definition.key)
                      : [...current, definition.key]);
                  }}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}

      {group === "notifications" && (
        <Card className={cn(embedded && "shadow-none")}>
          <CardHeader><CardTitle className="text-base">Kiểm tra kênh email</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Input type="email" value={testRecipient} onChange={(event) => setTestRecipient(event.target.value)} placeholder="Email nhận kiểm tra" />
            <Button
              variant="outline"
              disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient) || testEmail.isPending}
              onClick={() => testEmail.mutate()}
            >
              <Mail className="h-4 w-4" /> Gửi email kiểm tra
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className={cn("mx-auto max-w-[1280px]", embedded && "max-w-none")}>
      {embedded ? (
        <>
          <div className="sticky top-0 z-10 flex min-h-[88px] items-center justify-between gap-4 border-b bg-background/95 py-4 pl-5 pr-14 backdrop-blur md:pl-7 md:pr-16">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden rounded-md bg-primary/10 p-2.5 text-primary sm:block"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold">{groupMeta.label}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{groupMeta.description}</p>
              </div>
            </div>
            <Button
              className="shrink-0"
              disabled={dirtyCount === 0 || save.isPending || Object.keys(errors).length > 0}
              onClick={() => save.mutate()}
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Lưu</span>
              {dirtyCount > 0 ? `(${dirtyCount})` : ""}
            </Button>
          </div>
          {settingsContent}
        </>
      ) : (
        <>
          <PageHeader
            title={groupMeta.label}
            description={groupMeta.description}
            icon={Icon}
            action={(
              <Button disabled={dirtyCount === 0 || save.isPending || Object.keys(errors).length > 0} onClick={() => save.mutate()}>
                <Save className="h-4 w-4" /> Lưu {dirtyCount > 0 ? `(${dirtyCount})` : ""}
              </Button>
            )}
          />

          <div className="overflow-hidden rounded-md border bg-card shadow-sm">
            <nav className="scrollbar-thin flex gap-1 overflow-x-auto border-b bg-muted/20 p-2 lg:hidden" aria-label="Danh mục cài đặt">
              {SETTINGS_SECTIONS.map((section) => {
                const SectionIcon = section.icon;
                const active = section.id === group;
                return (
                  <Link
                    key={section.id}
                    href={`/admin/settings/${section.id}`}
                    className={cn(
                      "flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-normal transition-colors",
                      active ? "bg-slate-200/70 text-foreground dark:bg-muted" : "text-muted-foreground hover:bg-slate-200/45 hover:text-foreground dark:hover:bg-muted/60",
                    )}
                  >
                    <SectionIcon className="h-4 w-4" />
                    {section.label}
                  </Link>
                );
              })}
            </nav>

            <div className="grid min-w-0 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="hidden border-r bg-slate-50/70 p-3 lg:block dark:bg-muted/20">
                <nav className="scrollbar-thin sticky top-24 max-h-[calc(100vh-8rem)] space-y-1 overflow-y-auto pr-1" aria-label="Danh mục cài đặt">
                  {SETTINGS_SECTIONS.map((section) => {
                    const SectionIcon = section.icon;
                    const active = section.id === group;
                    return (
                      <Link
                        key={section.id}
                        href={`/admin/settings/${section.id}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-normal transition-colors",
                          active
                            ? "bg-slate-200/70 text-foreground dark:bg-muted"
                            : "text-muted-foreground hover:bg-slate-200/45 hover:text-foreground dark:hover:bg-muted/60",
                        )}
                      >
                        <SectionIcon className="h-[18px] w-[18px] shrink-0" />
                        <span className="min-w-0 flex-1">{section.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </aside>
              <section className="min-w-0 bg-background/70">
                {settingsContent}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "P0" | "P1" | "P2" }) {
  return (
    <Badge className={cn(
      priority === "P0" && "bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950/40 dark:text-red-300",
      priority === "P1" && "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
      priority === "P2" && "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
    )}>
      {priority}
    </Badge>
  );
}

function SettingField({
  definition,
  value,
  rawJson,
  error,
  secretConfigured,
  clearPending,
  onChange,
  onJsonChange,
  onClearSecret,
}: {
  definition: SystemSettingDefinition;
  value: SystemSettingValue;
  rawJson?: string;
  error?: string;
  secretConfigured: boolean;
  clearPending: boolean;
  onChange: (value: SystemSettingValue) => void;
  onJsonChange: (value: string) => void;
  onClearSecret: () => void;
}) {
  const label = (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">{definition.label}</span>
      {definition.secret && (
        <Badge variant={secretConfigured && !clearPending ? "default" : "secondary"}>
          {clearPending ? "Sẽ xóa" : secretConfigured ? "Đã cấu hình" : "Chưa cấu hình"}
        </Badge>
      )}
    </div>
  );
  const help = definition.description ? <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{definition.description}</p> : null;
  const errorText = error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null;

  if (definition.type === "boolean") {
    return (
      <label className="flex min-h-[76px] items-center justify-between gap-4 rounded-lg border p-4">
        <div>{label}{help}</div>
        <input className="h-5 w-5 accent-primary" type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      </label>
    );
  }

  if (definition.type === "json") {
    const display = rawJson ?? JSON.stringify(value, null, 2);
    return (
      <label className="space-y-1 lg:col-span-2">
        {label}
        <Textarea className="min-h-36 font-mono text-xs" value={display} onChange={(event) => onJsonChange(event.target.value)} spellCheck={false} />
        {help}{errorText}
      </label>
    );
  }

  if (definition.type === "list") {
    return (
      <label className="space-y-1">
        {label}
        <Textarea
          rows={4}
          value={Array.isArray(value) ? value.join("\n") : ""}
          onChange={(event) => onChange(event.target.value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean))}
          placeholder="Mỗi giá trị một dòng"
        />
        {help}{errorText}
      </label>
    );
  }

  if (definition.type === "select") {
    return (
      <label className="space-y-1">
        {label}
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{definition.options?.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
        {help}{errorText}
      </label>
    );
  }

  if (definition.type === "textarea") {
    return (
      <label className="space-y-1 lg:col-span-2">
        {label}
        <Textarea rows={4} value={String(value)} onChange={(event) => onChange(event.target.value)} />
        {help}{errorText}
      </label>
    );
  }

  if (definition.type === "secret") {
    return (
      <div className="space-y-1">
        {label}
        <div className="flex gap-2">
          <Input
            type="password"
            autoComplete="new-password"
            value={String(value)}
            disabled={clearPending}
            placeholder={secretConfigured ? "Để trống để giữ secret hiện tại" : "Nhập secret"}
            onChange={(event) => onChange(event.target.value)}
          />
          {secretConfigured && <Button type="button" variant={clearPending ? "secondary" : "outline"} onClick={onClearSecret}>{clearPending ? "Hoàn tác" : "Xóa"}</Button>}
        </div>
        {help}{errorText}
      </div>
    );
  }

  return (
    <label className="space-y-1">
      {label}
      <div className="flex gap-2">
        {definition.type === "color" && (
          <Input className="w-14 shrink-0 p-1" type="color" value={String(value)} onChange={(event) => onChange(event.target.value.toUpperCase())} />
        )}
        <Input
          type={definition.type === "number" ? "number" : definition.type === "email" ? "email" : definition.type === "url" ? "url" : "text"}
          value={String(value)}
          min={definition.min}
          max={definition.max}
          step={definition.integer ? 1 : definition.type === "number" ? "any" : undefined}
          placeholder={definition.placeholder}
          onChange={(event) => onChange(definition.type === "number" ? Number(event.target.value) : event.target.value)}
        />
      </div>
      {help}{errorText}
    </label>
  );
}

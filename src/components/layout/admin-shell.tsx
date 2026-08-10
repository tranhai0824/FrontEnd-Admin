"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/sidebar-content";
import { Topbar } from "@/components/layout/topbar";
import { AccountSettingsDialog } from "@/features/settings/account-settings-dialog";

const labels: Array<[string, string]> = [
  ["/admin/scholarships", "Học bổng"],
  ["/admin/partners", "Đối tác"],
  ["/admin/users", "Người dùng"],
  ["/admin/applications", "Hồ sơ ứng tuyển"],
  ["/admin/consulting", "Yêu cầu tư vấn"],
  ["/admin/content", "Quản lý nội dung"],
  ["/admin/notifications", "Thông báo"],
  ["/admin/trash", "Thùng rác"],
  ["/admin/system", "Giám sát hệ thống"],
  ["/admin/analytics", "Phân tích"],
  ["/admin/reports", "Báo cáo vi phạm"],
  ["/admin/audit-logs", "Nhật ký thao tác"],
  ["/admin/settings", "Cài đặt"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const pageLabel = pathname === "/admin"
    ? "Tổng quan"
    : labels.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Quản trị";
  return (
    <div className="min-h-screen bg-background">
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-slate-100 bg-white shadow-[1px_0_2px_rgba(15,23,42,0.02)] transition-[width] duration-200 dark:border-border dark:bg-card lg:block", sidebarCollapsed ? "w-[72px]" : "w-56")}>
        <SidebarContent collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} onOpenSettings={() => setSettingsOpen(true)} />
      </aside>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Điều hướng quản trị</SheetTitle>
          <SheetDescription className="sr-only">Danh sách các khu vực quản trị hệ thống</SheetDescription>
          <SidebarContent mobile onNavigate={() => setMobileMenuOpen(false)} onOpenSettings={() => { setMobileMenuOpen(false); setSettingsOpen(true); }} />
        </SheetContent>
      </Sheet>
      <div className={cn("transition-[padding] duration-200", sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-56")}>
        <Topbar onOpenMenu={() => setMobileMenuOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
        <main className="relative p-4 md:p-6 lg:p-8">
          <nav className="hidden" aria-label="Breadcrumb">
            <Link href="/admin" className="flex items-center gap-1 transition-colors hover:text-[#2C6EAF]"><Home className="h-3.5 w-3.5" />Admin</Link>
            {pathname !== "/admin" && <><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-[#181818] dark:text-foreground">{pageLabel}</span></>}
          </nav>
          {children}
        </main>
      </div>
      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

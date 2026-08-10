"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronRight, CircleHelp, Keyboard, LogOut, Mail, Menu, Search, Settings, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/utils";

export function Topbar({ onOpenMenu, onOpenSettings }: { onOpenMenu: () => void; onOpenSettings: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const pageLabel = pathname === "/admin" ? "Dashboard" : pathname.includes("analytics") ? "Phân tích" : pathname.includes("scholarships") ? "Học bổng" : pathname.includes("users") ? "Người dùng" : pathname.includes("partners") ? "Đối tác KYC" : pathname.includes("applications") ? "Hồ sơ ứng tuyển" : pathname.includes("consulting") ? "Yêu cầu tư vấn" : pathname.includes("reports") ? "Báo cáo vi phạm" : pathname.includes("settings") ? "Cài đặt" : "Quản trị";
  const breadcrumbSection = pathname.includes("scholarships") ? "Vận hành" : "Tổng quan";
  const profile = useQuery({
    queryKey: ["admin-profile-topbar"],
    queryFn: async () => {
      const response = await authClient.fetch("/api/v1/admin/settings/profile");
      if (!response.ok) throw new Error("Không thể tải tài khoản");
      return response.json() as Promise<{ email: string | null; role: string; profile: { fullName: string | null } | null }>;
    },
  });
  const notifications = useQuery({
    queryKey: ["admin-notifications-badge"],
    queryFn: async () => {
      const response = await authClient.fetch("/api/v1/admin/notifications?pageSize=1&unread=true");
      if (!response.ok) return 0;
      return ((await response.json()) as { unread: number }).unread;
    },
    refetchInterval: 30_000,
  });
  const user = {
    name: profile.data?.profile?.fullName ?? profile.data?.email ?? "Quản trị viên",
    role: profile.data?.role ?? "ADMIN",
  };
  const logout = async () => {
    await authClient.logout();
    router.replace("/login");
  };

  return (
    <header className="relative sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-100 bg-white/95 px-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur md:px-6 dark:border-border dark:bg-card/95">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Mở menu"><Menu /></Button>
      <div className="hidden items-center gap-1.5 whitespace-nowrap text-sm text-[#6F7882] md:flex"><span>{breadcrumbSection}</span><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-[#181818]">{pageLabel}</span></div>
      <div className="topbar-search relative ml-8 hidden w-full max-w-xl md:absolute md:left-[260px] md:ml-0 md:block">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="bg-[#F8FAFC] pl-9 dark:bg-background" placeholder="Tìm người dùng, học bổng..." aria-label="Tìm kiếm toàn hệ thống" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Thông báo" onClick={() => router.push("/admin/notifications")}>
          <Bell />
          {(notifications.data ?? 0) > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-card bg-red-500 px-0.5 text-[9px] font-bold text-white">{Math.min(notifications.data ?? 0, 99)}</span>}
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Hộp thư" onClick={() => router.push("/admin/system/emails-sent")}>
          <Mail />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-11 gap-2 rounded-full px-2 sm:pr-3">
              <Avatar className="h-8 w-8"><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            
            <DropdownMenuItem onClick={() => router.push("/admin/settings/profile")}><UserRound /> Hồ sơ quản trị</DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenSettings}><Settings /> Cài đặt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/settings/profile?section=shortcuts")}><Keyboard /> Phím tắt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/consulting?topic=support")}><CircleHelp /> Trợ giúp & hỗ trợ</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600" onClick={() => void logout()}><LogOut /> Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

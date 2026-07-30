"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_NAVIGATION } from "@/config/navigation";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Brand } from "@/components/layout/brand";
import { authClient } from "@/lib/auth-client";

interface SidebarContentProps {
  mobile?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  onOpenSettings?: () => void;
}

export function SidebarContent({ mobile = false, collapsed = false, onToggle, onNavigate, onOpenSettings }: SidebarContentProps) {
  const pathname = usePathname();
  const isCollapsed = !mobile && collapsed;
  const profile = useQuery({
    queryKey: ["admin-profile-topbar"],
    queryFn: async () => {
      const response = await authClient.fetch("/api/v1/admin/settings/profile");
      if (!response.ok) throw new Error("Không thể tải tài khoản");
      return response.json() as Promise<{ email: string | null; role: string; profile: { fullName: string | null } | null }>;
    },
  });
  const userName = profile.data?.profile?.fullName ?? profile.data?.email ?? "Quản trị viên";
  const userRole = profile.data?.role ?? "ADMIN";

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b">
        <Brand compact={isCollapsed} />
        {!mobile && (
          <Button variant="ghost" size="icon" className="mr-2 hidden h-8 w-8 lg:inline-flex" onClick={onToggle} aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}>
            <ChevronLeft className={cn("transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        )}
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">
        {ADMIN_NAVIGATION.map((group) => (
          <div key={group.label} className="mb-6">
            {!isCollapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-normal text-[#606061] transition-colors duration-200 hover:bg-slate-100/80 hover:text-[#606061] dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-muted-foreground",
                      active && "bg-slate-100 text-[#606061] hover:bg-slate-100 hover:text-[#606061] dark:bg-muted dark:text-muted-foreground dark:hover:text-muted-foreground",
                      isCollapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!isCollapsed && item.badge && <Badge variant="secondary" className="px-2 text-[10px]">{item.badge}</Badge>}
                  </Link>
                );
                return isCollapsed ? <Tooltip key={item.href}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{item.label}</TooltipContent></Tooltip> : <div key={item.href}>{link}</div>;
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className={cn("border-t", isCollapsed ? "p-2.5" : "p-3")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                "group flex w-full items-center rounded-md text-left transition-colors hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-muted",
                isCollapsed ? "justify-center p-2" : "gap-3 p-2.5",
              )}
              onClick={onOpenSettings}
              aria-label="Mở cài đặt tài khoản"
            >
              <Avatar className="h-9 w-9 shrink-0 border border-primary/15 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(userName)}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{userName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{userRole}</p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground">
                    <Settings className="h-4 w-4" />
                  </span>
                </>
              )}
            </button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">Tài khoản & cài đặt</TooltipContent>}
        </Tooltip>
      </div>
    </div>
  );
}

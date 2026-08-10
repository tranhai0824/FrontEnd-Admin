"use client";

import type { SystemSettingGroup } from "@scholarship/shared";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SETTINGS_SECTIONS } from "@/features/settings/settings-sections";
import { SystemSettingsWorkspace } from "@/features/settings/system-settings-workspace";
import { cn } from "@/lib/utils";

export function AccountSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeGroup, setActiveGroup] = useState<SystemSettingGroup>("general");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(820px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-[1120px] gap-0 overflow-hidden rounded-lg p-0">
        <DialogTitle className="sr-only">Cài đặt TopScholar</DialogTitle>
        <DialogDescription className="sr-only">
          Điều chỉnh cấu hình tài khoản và vận hành nền tảng TopScholar.
        </DialogDescription>

        <div className="grid h-full min-h-0 grid-rows-[auto_1fr] md:grid-cols-[260px_minmax(0,1fr)] md:grid-rows-1">
          <aside className="min-h-0 border-b bg-slate-50/80 p-3 md:border-b-0 md:border-r md:p-4 dark:bg-muted/30">
            <div className="hidden px-3 pb-4 pt-2 md:block">
              <p className="text-base font-semibold">Cài đặt</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Tài khoản và cấu hình vận hành</p>
            </div>
            <nav
              className="scrollbar-thin flex gap-1 overflow-x-auto md:block md:h-[calc(100%-64px)] md:space-y-1 md:overflow-x-hidden md:overflow-y-auto"
              aria-label="Danh mục cài đặt"
            >
              {SETTINGS_SECTIONS.map((group) => {
                const Icon = group.icon;
                const active = group.id === activeGroup;
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={cn(
                      "flex h-11 shrink-0 items-center gap-3 rounded-md px-3 text-left text-sm font-normal transition-colors md:w-full",
                      active
                        ? "bg-slate-200/70 text-foreground dark:bg-muted"
                        : "text-muted-foreground hover:bg-slate-200/45 hover:text-foreground dark:hover:bg-muted/60",
                    )}
                    onClick={() => setActiveGroup(group.id)}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-slate-600 dark:text-slate-300")} />
                    <span className="whitespace-nowrap font-normal md:min-w-0 md:flex-1 md:truncate">{group.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="scrollbar-thin min-h-0 overflow-y-auto bg-background">
            <SystemSettingsWorkspace key={activeGroup} group={activeGroup} embedded />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

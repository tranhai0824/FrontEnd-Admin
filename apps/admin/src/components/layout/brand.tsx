import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex h-16 items-center gap-3 px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className={cn("min-w-0 transition-opacity", compact && "lg:hidden")}>
        <p className="truncate text-sm font-bold tracking-tight">Scholarship Platform</p>
        <p className="truncate text-[11px] font-medium text-muted-foreground">Admin Console</p>
      </div>
    </div>
  );
}


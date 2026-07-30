import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  detail: string;
  growth: number;
  icon: LucideIcon;
  sparkline?: number[];
  tone?: "blue" | "green" | "amber" | "cyan";
}

const tones = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
};

export function StatCard({ title, value, detail, growth, icon: Icon, sparkline = [], tone = "blue" }: StatCardProps) {
  const positive = growth >= 0;
  const max = Math.max(...sparkline, 1);
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="flex items-center gap-1 text-xs">
            <span className={cn("flex items-center font-semibold", positive ? "text-emerald-600" : "text-red-600")}>
              {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(growth)}%
            </span>
            <span className="text-muted-foreground">so với kỳ trước</span>
          </div>
          <div className="flex h-8 w-24 items-end gap-1" aria-label="Xu hướng trong kỳ">
            {sparkline.slice(-12).map((point, index) => (
              <span key={index} className="flex-1 rounded-sm bg-primary/40" style={{ height: `${Math.max(12, (point / max) * 100)}%` }} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

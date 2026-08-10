import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  detail: string;
  growth: number;
  icon: LucideIcon | string;
  sparkline?: number[];
  tone?: "blue" | "green" | "amber" | "cyan" | "red";
  progress?: number;
}

const tones = {
  blue: "bg-white text-blue-700",
  green: "bg-white text-emerald-700",
  amber: "bg-white text-amber-700",
  cyan: "bg-white text-cyan-700",
  red: "bg-white text-red-700",
};

export function StatCard({ title, value, detail, growth, icon: Icon, sparkline = [], tone = "blue", progress = 68 }: StatCardProps) {
  const positive = growth >= 0;
  const max = Math.max(...sparkline, 1);
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-[#52657A]">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center", tones[tone])}>
            {typeof Icon === "string" ? <img src={Icon} alt="" style={Icon.includes("views.png") ? { clipPath: "inset(0 0 18% 0)" } : undefined} className={cn("h-8 w-8 object-contain mix-blend-multiply", Icon.includes("users.png") && "scale-90", Icon.includes("news.png") && "scale-90", Icon.includes("submitted.png") && "scale-75", Icon.includes("mentor.png") && "scale-150", Icon.includes("mentor-rentals.png") && "scale-110")} /> : <Icon className="h-6 w-6" />}
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
          {sparkline.length >= 7 && <div className="flex h-8 w-24 items-end gap-1" aria-label="Xu hướng trong kỳ">
            {sparkline.slice(-12).map((point, index) => (
              <span key={index} className="flex-1 rounded-sm bg-primary/40" style={{ height: `${Math.max(12, (point / max) * 100)}%` }} />
            ))}
          </div>}
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-label={`Tiến độ ${progress}%`}>
          <div className={cn("h-full rounded-full transition-all", tone === "green" ? "bg-[#16B39A]" : tone === "amber" ? "bg-[#E99500]" : tone === "cyan" ? "bg-[#20A247]" : tone === "red" ? "bg-[#D83232]" : "bg-[#4F8EF7]")} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_STATUS_LABELS,
  ENTITY_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SCHOLARSHIP_STATUS_LABELS,
} from "@/config/constants";
import { cn } from "@/lib/utils";

type KnownStatus = keyof typeof ENTITY_STATUS_LABELS | keyof typeof SCHOLARSHIP_STATUS_LABELS | keyof typeof APPLICATION_STATUS_LABELS | keyof typeof PAYMENT_STATUS_LABELS;

const statusClasses: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  reviewing: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900",
  submitted: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900",
  shortlisted: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900",
  draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  inactive: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  closed: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  blocked: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  failed: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  refunded: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900",
};

const labels: Record<string, string> = {
  ...PAYMENT_STATUS_LABELS,
  ...APPLICATION_STATUS_LABELS,
  ...SCHOLARSHIP_STATUS_LABELS,
  ...ENTITY_STATUS_LABELS,
};

export function StatusBadge({ status, label }: { status: KnownStatus; label?: string }) {
  return <Badge variant="outline" className={cn("font-medium", statusClasses[status])}>{label ?? labels[status] ?? status}</Badge>;
}

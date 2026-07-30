import { cn } from "@/lib/utils";

export function PacmanLoader({
  label = "Đang tải dữ liệu…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("pacman-loading min-h-44", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="lds-pacman" aria-hidden="true">
        <div><i /><i /><i /></div>
        <div><i /><i /></div>
      </div>
      <p>{label}</p>
    </div>
  );
}

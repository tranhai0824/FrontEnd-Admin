import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FormField({
  id,
  label,
  description,
  error,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p> : null}
      {!error && description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

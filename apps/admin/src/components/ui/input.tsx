import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#181818] placeholder:text-slate-400 transition-colors hover:border-slate-300 focus-visible:border-[#2C6EAF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-input dark:bg-background dark:text-foreground",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
export { Input };

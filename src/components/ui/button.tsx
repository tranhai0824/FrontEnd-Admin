import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#2C6EAF] text-white shadow-sm hover:bg-[#1E5084]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-slate-200 bg-white text-[#181818] hover:border-[#DCEAF6] hover:bg-[#F4F8FC] hover:text-[#2C6EAF] dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted",
        secondary: "bg-[#F4F8FC] text-[#12385D] hover:bg-[#EAF2F9] dark:bg-secondary dark:text-secondary-foreground",
        ghost: "hover:bg-[#F4F8FC] hover:text-[#2C6EAF] dark:hover:bg-muted dark:hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-[#DCEAF6] bg-[#F4F8FC] text-[#2C6EAF] dark:border-border dark:bg-primary/15 dark:text-primary"><Icon className="h-5 w-5" /></div>}
        <div><h1 className="text-2xl font-bold tracking-normal text-[#181818] dark:text-foreground md:text-[28px]">{title}</h1><p className="mt-1 text-sm font-normal text-[#6F7882] dark:text-muted-foreground">{description}</p></div>
      </div>
      {action}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  void title;
  void description;
  void Icon;
  return action ? <div className="page-header-actions relative mb-0 flex h-20 items-start justify-end">{action}</div> : null;
}

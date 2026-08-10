import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  FileCheck2,
  FileText,
  Flag,
  GraduationCap,
  HardDrive,
  Headphones,
  History,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  MailCheck,
  Tags,
  Trash2,
  Users,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const ADMIN_NAVIGATION: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: "Tổng quan",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Phân tích", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Vận hành",
    items: [
      { label: "Học bổng", href: "/admin/scholarships", icon: GraduationCap },
      { label: "Đối tác KYC", href: "/admin/partners", icon: Building2 },
      { label: "Người dùng", href: "/admin/users", icon: Users },
      { label: "Hồ sơ ứng tuyển", href: "/admin/applications", icon: FileCheck2 },
      { label: "Yêu cầu tư vấn", href: "/admin/consulting", icon: Headphones },
      { label: "Báo cáo vi phạm", href: "/admin/reports", icon: Flag },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { label: "Bài viết", href: "/admin/content/posts", icon: FileText },
      { label: "Banner", href: "/admin/content/banners", icon: Image },
      { label: "Trang tĩnh", href: "/admin/content/pages", icon: LayoutTemplate },
      { label: "Học bổng nổi bật", href: "/admin/content/featured", icon: GraduationCap },
    ],
  },
  {
    label: "Cấu hình",
    items: [
      { label: "Danh mục", href: "/admin/settings/taxonomies", icon: Tags },
      { label: "Mẫu email", href: "/admin/settings/emails", icon: Mail },
      { label: "Đội ngũ", href: "/admin/settings/team", icon: Users },
    ],
  },
  {
    label: "Giám sát",
    items: [
      { label: "Thông báo", href: "/admin/notifications", icon: Bell },
      { label: "Nhật ký thao tác", href: "/admin/audit-logs", icon: History },
      { label: "Thùng rác", href: "/admin/trash", icon: Trash2 },
      { label: "Sức khỏe hệ thống", href: "/admin/system/health", icon: Activity },
      { label: "BullMQ jobs", href: "/admin/system/jobs", icon: HardDrive },
      { label: "Email đã gửi", href: "/admin/system/emails-sent", icon: MailCheck },
    ],
  },
];

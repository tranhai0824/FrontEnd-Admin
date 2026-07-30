import { SYSTEM_SETTING_GROUPS, type SystemSettingGroup } from "@scholarship/shared";
import {
  Bell,
  Building2,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  HardDrive,
  Languages,
  Mail,
  Search,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

const SECTION_ICONS = {
  general: Building2,
  localization: Languages,
  accounts: UserRound,
  security: ShieldCheck,
  storage: HardDrive,
  scholarships: GraduationCap,
  applications: FileCheck2,
  kyc: CheckCircle2,
  support: Bell,
  notifications: Mail,
  seo: Search,
} satisfies Record<SystemSettingGroup, LucideIcon>;

export const SETTINGS_SECTIONS = SYSTEM_SETTING_GROUPS.map((group) => ({
  ...group,
  icon: SECTION_ICONS[group.id],
}));

export function getSettingsSection(group: SystemSettingGroup) {
  return SETTINGS_SECTIONS.find((section) => section.id === group)!;
}

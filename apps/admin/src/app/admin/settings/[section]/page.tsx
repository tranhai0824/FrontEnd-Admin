import { isSystemSettingGroup } from "@scholarship/shared";
import { notFound } from "next/navigation";
import { SystemSettingsWorkspace } from "@/features/settings/system-settings-workspace";

export default function SettingsSectionPage({ params }: { params: { section: string } }) {
  if (!isSystemSettingGroup(params.section)) notFound();
  return <SystemSettingsWorkspace group={params.section} />;
}

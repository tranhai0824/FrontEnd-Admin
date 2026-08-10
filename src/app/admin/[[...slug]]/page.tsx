import { notFound } from 'next/navigation';
import { SYSTEM_SETTING_GROUPS, type SystemSettingGroup } from '@scholarship/shared';
import { AnalyticsOverview } from '@/features/analytics/analytics-overview';
import { ApplicationManagement } from '@/features/applications/application-management';
import { AuditLogManagement } from '@/features/audit-logs/audit-log-management';
import { ConsultingManagement } from '@/features/consulting/consulting-management';
import { ContentManagement } from '@/features/content/content-management';
import { DashboardOverview } from '@/features/dashboard/dashboard-overview';
import { OperationsCenter } from '@/features/operations/operations-center';
import { PartnerManagement } from '@/features/partners/partner-management';
import { PaymentManagement } from '@/features/payments/payment-management';
import { ScholarshipManagement } from '@/features/scholarships/scholarship-management';
import { SettingsPage } from '@/features/settings/settings-page';
import { SettingsHub, SystemSettingsWorkspace } from '@/features/settings/system-settings-workspace';
import { UserDetail } from '@/features/users/user-detail';
import { UserManagement } from '@/features/users/user-management';

type Props = { params: { slug?: string[] } };
const systemSettingGroups = new Set<SystemSettingGroup>(SYSTEM_SETTING_GROUPS.map((group) => group.id));

export default function AdminPage({ params }: Props) {
  const slug = params.slug ?? [];
  const path = slug.join('/');
  if (!path) return <DashboardOverview />;
  if (path === 'analytics') return <AnalyticsOverview />;
  if (path === 'scholarships') return <ScholarshipManagement />;
  if (path === 'partners') return <PartnerManagement />;
  if (path === 'users') return <UserManagement />;
  if (slug[0] === 'users' && slug[1]) return <UserDetail id={slug[1]} />;
  if (path === 'applications') return <ApplicationManagement />;
  if (path === 'consulting') return <ConsultingManagement />;
  if (path === 'payments') return <PaymentManagement />;
  if (path === 'audit-logs') return <AuditLogManagement />;
  if (path === 'reports') return <OperationsCenter view="reports" />;
  if (path === 'notifications') return <OperationsCenter view="notifications" />;
  if (path === 'trash') return <OperationsCenter view="trash" />;
  if (path === 'system/health') return <OperationsCenter view="health" />;
  if (path === 'system/jobs') return <OperationsCenter view="jobs" />;
  if (path === 'system/emails-sent') return <OperationsCenter view="emails" />;
  if (path === 'content/posts') return <ContentManagement section="posts" />;
  if (path === 'content/banners') return <ContentManagement section="banners" />;
  if (path === 'content/pages') return <ContentManagement section="pages" />;
  if (path === 'content/featured') return <ContentManagement section="featured" />;
  if (path === 'settings') return <SettingsHub />;
  if (slug[0] === 'settings' && ['taxonomies', 'emails', 'team', 'profile'].includes(slug[1] ?? '')) return <SettingsPage section={slug[1] as 'taxonomies' | 'emails' | 'team' | 'profile'} />;
  if (slug[0] === 'settings' && systemSettingGroups.has(slug[1] as SystemSettingGroup)) return <SystemSettingsWorkspace group={slug[1] as SystemSettingGroup} />;
  notFound();
}

import type { AngelBirdRole, AuthUser } from '@/auth/types';

export const REPORTING_ROLES = ['owner', 'admin', 'analyst', 'viewer'] as const;
export type ReportingRole = (typeof REPORTING_ROLES)[number];

export function isReportingRole(role: AngelBirdRole): role is ReportingRole {
  return REPORTING_ROLES.includes(role as ReportingRole);
}

export function canViewReports(user: AuthUser | null | undefined) {
  return Boolean(user && user.status === 'active' && isReportingRole(user.role));
}

export function canForceRefresh(user: AuthUser | null | undefined) {
  return canViewReports(user);
}

export function roleLabel(role: AngelBirdRole) {
  return isReportingRole(role) ? role.charAt(0).toUpperCase() + role.slice(1) : 'Restricted';
}

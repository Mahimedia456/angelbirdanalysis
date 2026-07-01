export const USER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  ANALYST: "analyst",
  VIEWER: "viewer",
};

export const PERMISSIONS = {
  VIEW_REPORTS:
    "view_reports",

  VIEW_DASHBOARD:
    "view_dashboard",

  VIEW_MONTHLY_DATA:
    "view_monthly_data",

  UPLOAD_DATA:
    "upload_data",

  MANAGE_REPORTING_PERIODS:
    "manage_reporting_periods",

  MANAGE_SETTINGS:
    "manage_settings",
};

const rolePermissions = {
  [USER_ROLES.OWNER]: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONTHLY_DATA,
    PERMISSIONS.UPLOAD_DATA,
    PERMISSIONS.MANAGE_REPORTING_PERIODS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],

  [USER_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONTHLY_DATA,
    PERMISSIONS.UPLOAD_DATA,
    PERMISSIONS.MANAGE_REPORTING_PERIODS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],

  [USER_ROLES.ANALYST]: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONTHLY_DATA,
  ],

  [USER_ROLES.VIEWER]: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONTHLY_DATA,
  ],
};

export function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase();
}

export function hasPermission(
  role,
  permission
) {
  const normalizedRole =
    normalizeRole(role);

  if (
    !normalizedRole ||
    !permission
  ) {
    return false;
  }

  return Boolean(
    rolePermissions[
      normalizedRole
    ]?.includes(permission)
  );
}

export function hasAnyRole(
  role,
  allowedRoles = []
) {
  const normalizedRole =
    normalizeRole(role);

  return allowedRoles
    .map(normalizeRole)
    .includes(normalizedRole);
}

export function canViewDashboard(
  role
) {
  return hasPermission(
    role,
    PERMISSIONS.VIEW_DASHBOARD
  );
}

export function canViewReports(
  role
) {
  return hasPermission(
    role,
    PERMISSIONS.VIEW_REPORTS
  );
}

export function canViewMonthlyData(
  role
) {
  return hasPermission(
    role,
    PERMISSIONS.VIEW_MONTHLY_DATA
  );
}

export function canUploadData(
  role
) {
  return hasPermission(
    role,
    PERMISSIONS.UPLOAD_DATA
  );
}

export function canManagePeriods(
  role
) {
  return hasPermission(
    role,
    PERMISSIONS.MANAGE_REPORTING_PERIODS
  );
}

export function canManageSettings(
  role
) {
  return hasPermission(
    role,
    PERMISSIONS.MANAGE_SETTINGS
  );
}

export function isOwner(
  role
) {
  return (
    normalizeRole(role) ===
    USER_ROLES.OWNER
  );
}

export function isAdmin(
  role
) {
  return (
    normalizeRole(role) ===
    USER_ROLES.ADMIN
  );
}

export function isViewOnlyRole(
  role
) {
  const normalizedRole =
    normalizeRole(role);

  return [
    USER_ROLES.ANALYST,
    USER_ROLES.VIEWER,
  ].includes(normalizedRole);
}

export function formatRoleName(
  role
) {
  const normalizedRole =
    normalizeRole(role);

  if (!normalizedRole) {
    return "Viewer";
  }

  return (
    normalizedRole
      .charAt(0)
      .toUpperCase() +
    normalizedRole.slice(1)
  );
}
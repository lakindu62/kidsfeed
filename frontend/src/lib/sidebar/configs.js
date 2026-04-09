import { APP_FEATURES } from '../app-features';
import { listUserRoles, USER_ROLES } from '../user-roles';
import { SIDEBAR_CONFIG_BY_FEATURE } from './configs';
import { ROLE_SIDEBAR_PERMISSIONS } from './configs/role-sidebar-permissions';

function cloneSection(section) {
  return {
    ...section,
    items: (section.items || []).map((item) => ({ ...item })),
  };
}

function cloneSidebarConfig(config) {
  return {
    ...config,
    sections: (config.sections || []).map(cloneSection),
    footerActions: (config.footerActions || []).map((action) => ({
      ...action,
    })),
    primaryCta: config.primaryCta ? { ...config.primaryCta } : null,
  };
}

function filterSectionsByAllowedKeys(sections, allowedItemKeys) {
  if (!Array.isArray(allowedItemKeys)) {
    return sections;
  }

  const allowedSet = new Set(allowedItemKeys);

  return sections
    .map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => allowedSet.has(item.key)),
    }))
    .filter((section) => section.items.length > 0);
}

function filterActionsByAllowedKeys(actions, allowedActionKeys) {
  if (!Array.isArray(allowedActionKeys)) {
    return actions;
  }

  const allowedSet = new Set(allowedActionKeys);
  return actions.filter((action) => allowedSet.has(action.key));
}

function resolveRolePermission(role, feature) {
  if (!role) {
    return null;
  }

  const rolePermissions = ROLE_SIDEBAR_PERMISSIONS[role];
  if (!rolePermissions) {
    return null;
  }

  return rolePermissions[feature] || rolePermissions['*'] || null;
}

export function getBaseSidebarConfig(feature) {
  const config = SIDEBAR_CONFIG_BY_FEATURE[feature];
  if (!config) {
    return null;
  }

  return cloneSidebarConfig(config);
}

export function buildSidebarConfig({
  feature,
  role,
  allowedItemKeys,
  allowedFooterActionKeys,
  includePrimaryCta = true,
} = {}) {
  const config = getBaseSidebarConfig(feature);
  if (!config) {
    return null;
  }

  const rolePermission = resolveRolePermission(role, feature);

  const effectiveAllowedItemKeys =
    allowedItemKeys !== undefined
      ? allowedItemKeys
      : rolePermission?.allowedItemKeys;

  const effectiveAllowedFooterActionKeys =
    allowedFooterActionKeys !== undefined
      ? allowedFooterActionKeys
      : rolePermission?.allowedFooterActionKeys;

  config.sections = filterSectionsByAllowedKeys(
    config.sections,
    effectiveAllowedItemKeys,
  );

  config.footerActions = filterActionsByAllowedKeys(
    config.footerActions || [],
    effectiveAllowedFooterActionKeys,
  );

  if (!includePrimaryCta) {
    config.primaryCta = null;
  }

  return config;
}

export function listAvailableSidebarFeatures() {
  return Object.values(APP_FEATURES);
}

export { APP_FEATURES, ROLE_SIDEBAR_PERMISSIONS, USER_ROLES, listUserRoles };

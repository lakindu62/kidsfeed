import { APP_FEATURES } from '../app-features';
import { SIDEBAR_CONFIG_BY_FEATURE } from './configs';
// import { ROLE_SIDEBAR_PERMISSIONS } from './configs/role-sidebar-permissions';

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

// function filterSectionsByAllowedKeys(sections, allowedItemKeys) {
//   if (!Array.isArray(allowedItemKeys)) {
//     return sections;
//   }
//
//   const allowedSet = new Set(allowedItemKeys);
//
//   return sections
//     .map((section) => ({
//       ...section,
//       items: (section.items || []).filter((item) => allowedSet.has(item.key)),
//     }))
//     .filter((section) => section.items.length > 0);
// }

// function filterActionsByAllowedKeys(actions, allowedActionKeys) {
//   if (!Array.isArray(allowedActionKeys)) {
//     return actions;
//   }
//
//   const allowedSet = new Set(allowedActionKeys);
//   return actions.filter((action) => allowedSet.has(action.key));
// }

// Role-based sidebar filtering is intentionally disabled for now.
// Keep the legacy matrix available in src/lib/sidebar/configs/role-sidebar-permissions.js
// if we need to restore it later.

export function getBaseSidebarConfig(feature) {
  const config = SIDEBAR_CONFIG_BY_FEATURE[feature];
  if (!config) {
    return null;
  }

  return cloneSidebarConfig(config);
}

export function buildSidebarConfig({
  feature,
  // role,
  // allowedItemKeys,
  // allowedFooterActionKeys,
  includePrimaryCta = true,
} = {}) {
  const config = getBaseSidebarConfig(feature);
  if (!config) {
    return null;
  }

  // Legacy key-based filtering remains below as a reference only.
  // config.sections = filterSectionsByAllowedKeys(config.sections, allowedItemKeys);
  // config.footerActions = filterActionsByAllowedKeys(
  //   config.footerActions || [],
  //   allowedFooterActionKeys,
  // );

  if (!includePrimaryCta) {
    config.primaryCta = null;
  }

  return config;
}

export function listAvailableSidebarFeatures() {
  return Object.values(APP_FEATURES);
}

// export { ROLE_SIDEBAR_PERMISSIONS };

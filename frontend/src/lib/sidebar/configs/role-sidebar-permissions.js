import { APP_FEATURES } from '../../app-features';
import { USER_ROLES } from '../../user-roles';

export const ROLE_SIDEBAR_PERMISSIONS = Object.freeze({
  [USER_ROLES.ADMIN]: {},

  [USER_ROLES.MEAL_PLANNER]: {
    [APP_FEATURES.MEAL_DISTRIBUTION]: {
      allowedItemKeys: [
        'dashboard',
        'sessions',
        'attendance',
        'no-show-alerts',
        'reports',
      ],
      allowedFooterActionKeys: ['support', 'logout'],
    },
    [APP_FEATURES.MEAL_PLANNING]: {
      allowedItemKeys: ['dashboard', 'plans', 'reports'],
      allowedFooterActionKeys: ['support', 'logout'],
    },
    [APP_FEATURES.MENU_MANAGEMENT]: {
      allowedItemKeys: ['dashboard', 'menus', 'calendar'],
      allowedFooterActionKeys: ['support', 'logout'],
    },
  },

  [USER_ROLES.INVENTORY_MANAGER]: {
    [APP_FEATURES.INVENTORY_MANAGEMENT]: {
      allowedItemKeys: ['dashboard', 'inventory', 'settings'],
      allowedFooterActionKeys: ['logout'],
    },
  },

  [USER_ROLES.STAFF]: {
    [APP_FEATURES.MEAL_DISTRIBUTION]: {
      allowedItemKeys: ['dashboard', 'sessions', 'attendance'],
      allowedFooterActionKeys: ['support', 'logout'],
    },
  },

  [USER_ROLES.UNASSIGNED]: {
    '*': {
      allowedItemKeys: [],
      allowedFooterActionKeys: [],
    },
  },
});

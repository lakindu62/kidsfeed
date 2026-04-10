export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  SCHOOL_ADMIN: 'school_admin',
  SCHOOL_STAFF: 'school_staff',
  MENU_MANAGER: 'menu_manager',
  MEAL_PLANNER: 'meal_planner',
  INVENTORY_MANAGER: 'inventory_manager',
  UNASSIGNED: 'unassigned',

  // Legacy roles kept for migration reference:
  // MEAL_PLANNER: 'meal_planner',
  // STAFF: 'staff',
});

export function listUserRoles() {
  return Object.values(USER_ROLES);
}

export function isValidUserRole(role) {
  return typeof role === 'string' && listUserRoles().includes(role);
}

export function normalizeUserRole(role) {
  return isValidUserRole(role) ? role : USER_ROLES.UNASSIGNED;
}

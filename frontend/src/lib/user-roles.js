export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  MEAL_PLANNER: 'meal_planner',
  INVENTORY_MANAGER: 'inventory_manager',
  UNASSIGNED: 'unassigned',
  STAFF: 'staff',
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

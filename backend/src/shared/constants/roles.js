/**
 * ROLES — Single source of truth for all user role strings in the backend.
 *
 * HOW TO ADD A NEW ROLE
 *   1. Add a new key/value pair to this object (e.g. NURSE: 'nurse').
 *   2. That's it. No other file needs to be updated just to register the role
 *      string itself. You only need to update requireRole() call-sites in
 *      route files to include (or exclude) the new role as appropriate.
 *
 * HOW TO REMOVE A ROLE
 *   1. Delete the key/value pair from this object.
 *   2. Search the codebase for any requireRole() calls that reference the
 *      removed constant and update them accordingly.
 *
 *  DO NOT
 *   - Do NOT hardcode role strings (e.g., 'admin') anywhere else in the
 *     backend. Always import and use this object.
 *   - Do NOT mutate this object at runtime — it is frozen.
 *
 *  With love from Amzal
 *  (Yes Lakindu, I am looking at you, dont do stupid shit)
 */
const ROLES = Object.freeze({
  /** Full system access. Can observe and manage all data. */
  ADMIN: 'admin',

  /** School administrator for school management. */
  SCHOOL_ADMIN: 'school_admin',

  /** School staff member responsible for meal distribution. */
  SCHOOL_STAFF: 'school_staff',

  /** Menu creation and menu management role. */
  MENU_CREATOR: 'menu_creator',

  /** Meal planning role. */
  MEAL_PLANNER: 'meal_planner',

  /** Manages stock levels, inventory items, and low-stock alerts. */
  INVENTORY_MANAGER: 'inventory_manager',

  /**
   * Default role assigned to every new user on first login.
   * Represents a user who has not yet been assigned a functional role.
   */
  UNASSIGNED: 'unassigned',

  /**
   * Staff role for internal users.
   * Can be assigned by admins after onboarding.
   */
  // Legacy roles kept for migration reference:
  // MEAL_PLANNER: 'meal_planner',
  // STAFF: 'staff',
});

export { ROLES };

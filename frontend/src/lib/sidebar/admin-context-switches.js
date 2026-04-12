export const ADMIN_CONTEXT_SWITCH_OPTIONS = Object.freeze([
  {
    key: 'admin',
    label: 'Admin page',
    description: 'User management',
    to: '/user-management',
  },
  {
    key: 'meal-planning',
    label: 'Meal planning',
    description: 'Weekly plans and reports',
    to: '/meal-planning',
  },
  {
    key: 'menu-management',
    label: 'Menu management',
    description: 'Recipes and menus',
    to: '/menu-management',
  },
  {
    key: 'meal-distribution',
    label: 'Meal distribution',
    description: 'Attendance and sessions',
    to: '/meal-distribution',
  },
  {
    key: 'school-management',
    label: 'School management',
    description: 'Schools and reports',
    to: '/school-management',
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Stock and supplies',
    to: '/inventory',
  },
]);

export function getAdminContextKeyFromPath(pathname = '') {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  const matchingOption = ADMIN_CONTEXT_SWITCH_OPTIONS.find(
    (option) =>
      normalizedPath === option.to ||
      normalizedPath.startsWith(`${option.to}/`),
  );

  return matchingOption?.key ?? 'admin';
}

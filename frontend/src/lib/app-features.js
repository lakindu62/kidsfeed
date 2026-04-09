export const APP_FEATURES = Object.freeze({
  MEAL_DISTRIBUTION: 'mealDistribution',
  SCHOOL_MANAGEMENT: 'schoolManagement',
  USER_MANAGEMENT: 'userManagement',
  INVENTORY_MANAGEMENT: 'inventoryManagement',
  MEAL_PLANNING: 'mealPlanning',
  MENU_MANAGEMENT: 'menuManagement',
});

export function listAppFeatures() {
  return Object.values(APP_FEATURES);
}

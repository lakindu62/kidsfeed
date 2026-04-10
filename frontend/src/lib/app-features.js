export const APP_FEATURES = Object.freeze({
  MEAL_DISTRIBUTION: 'mealDistribution', //SCHOOL_STAFF
  SCHOOL_MANAGEMENT: 'schoolManagement', //SCHOOL_ADMIN
  USER_MANAGEMENT: 'userManagement', //ADMIN
  INVENTORY_MANAGEMENT: 'inventoryManagement', //INVENTORY_MANAGER
  MEAL_PLANNING: 'mealPlanning', //MEAL_PLANNER
  MENU_MANAGEMENT: 'menuManagement', //MENU_CREATOR
});

export function listAppFeatures() {
  return Object.values(APP_FEATURES);
}

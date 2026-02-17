/**
 * Application Constants
 *
 * Central repository for all application-wide constants used in the meal planning
 * and menu management module. This ensures consistency across the application and
 * provides a single source of truth for domain-specific values.
 *
 * @module meal-planning-and-menu-management/application/constants
 */

/**
 * Dietary flag identifiers for recipe and meal classification
 *
 * Used to mark recipes with specific dietary attributes. These flags enable
 * filtering and matching recipes to children's dietary requirements and restrictions.
 *
 * @constant {Object} DIETARY_FLAGS
 * @property {string} VEGETARIAN - No meat or fish (may include dairy and eggs)
 * @property {string} VEGAN - No animal products whatsoever
 * @property {string} HALAL - Prepared according to Islamic dietary laws
 * @property {string} GLUTEN_FREE - Contains no gluten proteins
 * @property {string} DAIRY_FREE - Contains no milk or dairy products
 * @property {string} NUT_FREE - Contains no nuts or nut-derived ingredients
 */
const DIETARY_FLAGS = {
  VEGETARIAN: 'vegetarian',
  VEGAN: 'vegan',
  HALAL: 'halal',
  GLUTEN_FREE: 'glutenFree',
  DAIRY_FREE: 'dairyFree',
  NUT_FREE: 'nutFree',
};

/**
 * Common food allergens recognized by the system
 *
 * Comprehensive list of allergens that must be tracked for child safety.
 * Based on common food allergens that can cause allergic reactions in children.
 * Used for allergen tracking, warnings, and dietary restriction enforcement.
 *
 * @constant {Array<string>} ALLERGENS
 *
 * @example
 * // Check if a recipe contains any allergens from a child's restriction list
 * const hasAllergen = ALLERGENS.some(allergen =>
 *   childAllergens.includes(allergen) && recipe.allergens.includes(allergen)
 * );
 */
const ALLERGENS = [
  'nuts', // Tree nuts (almonds, walnuts, cashews, etc.)
  'peanuts', // Peanuts (legume, not a tree nut)
  'dairy', // Milk and dairy products
  'eggs', // Chicken eggs and egg products
  'soy', // Soybeans and soy-derived products
  'wheat', // Wheat grain and wheat flour
  'gluten', // Gluten protein (found in wheat, barley, rye)
  'shellfish', // Crustaceans and mollusks
  'fish', // Fish and fish products
  'sesame', // Sesame seeds and sesame oil
];

/**
 * Meal type classifications for daily meal planning
 *
 * Defines the types of meals that can be planned and served.
 * Currently limited to breakfast and lunch for the daycare/school setting.
 *
 * @constant {Array<string>} MEAL_TYPES
 *
 * @example
 * // Validate meal type input
 * if (!MEAL_TYPES.includes(mealType)) {
 *   throw new Error('Invalid meal type');
 * }
 */
const MEAL_TYPES = [
  'breakfast', // Morning meal
  'lunch', // Midday meal
];

/**
 * Days of the week for meal planning
 *
 * Standard week days used for scheduling meals in the weekly meal plan.
 * Ordered from Monday to Sunday following ISO 8601 standard.
 *
 * @constant {Array<string>} DAYS_OF_WEEK
 *
 * @example
 * // Generate a weekly meal plan structure
 * const weeklyPlan = DAYS_OF_WEEK.map(day => ({
 *   day,
 *   meals: { breakfast: null, lunch: null }
 * }));
 */
const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Meal plan status workflow states
 *
 * Represents the lifecycle stages of a meal plan from initial planning
 * through confirmation to actual serving. Used for workflow management
 * and tracking meal plan progress.
 *
 * @constant {Object} MEAL_PLAN_STATUS
 * @property {string} PLANNED - Initial state: meal plan has been created but not yet confirmed
 * @property {string} CONFIRMED - Intermediate state: meal plan has been reviewed and approved
 * @property {string} SERVED - Final state: meals have been prepared and served to children
 *
 * @example
 * // Update meal plan status after confirmation
 * mealPlan.status = MEAL_PLAN_STATUS.CONFIRMED;
 */
const MEAL_PLAN_STATUS = {
  PLANNED: 'planned', // Meal plan created, pending review
  CONFIRMED: 'confirmed', // Meal plan approved, ready for preparation
  SERVED: 'served', // Meals have been served to children
};

// Export all constants for use throughout the application
module.exports = {
  DIETARY_FLAGS,
  ALLERGENS,
  MEAL_TYPES,
  DAYS_OF_WEEK,
  MEAL_PLAN_STATUS,
};

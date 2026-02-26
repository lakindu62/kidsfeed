// Central constants for meal planning and menu management

// Dietary classification flags for recipe filtering
const DIETARY_FLAGS = {
  VEGETARIAN: 'vegetarian',
  VEGAN: 'vegan',
  HALAL: 'halal',
  GLUTEN_FREE: 'glutenFree',
  DAIRY_FREE: 'dairyFree',
  NUT_FREE: 'nutFree',
};

// Tracked allergens for child safety
const ALLERGENS = [
  'nuts',
  'peanuts',
  'dairy',
  'eggs',
  'soy',
  'wheat',
  'gluten',
  'shellfish',
  'fish',
  'sesame',
];

// Supported meal types for daily planning
const MEAL_TYPES = ['breakfast', 'lunch'];

// ISO-ordered days of the week for weekly meal scheduling
const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Lifecycle states of a meal plan
const MEAL_PLAN_STATUS = {
  PLANNED: 'planned',
  CONFIRMED: 'confirmed',
  SERVED: 'served',
};

export default {
  DIETARY_FLAGS,
  ALLERGENS,
  MEAL_TYPES,
  DAYS_OF_WEEK,
  MEAL_PLAN_STATUS,
};

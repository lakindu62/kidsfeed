import MealPlanSchema from '../../../meal-planning/infrastructure/schemas/MealPlanSchema.js';
import RecipeSchema from '../../../menu-management/infrastructure/schemas/RecipeSchema.js';

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Read-only cross-module lookup that resolves the planned meal description
 * for a given school + calendar date + meal type.
 *
 * Returns `null` for every field when no matching meal plan or entry exists,
 * so callers can safely treat the result as optional.
 */
export class MealPlanLookupService {
  async getMealDescription(schoolId, date, mealType) {
    const empty = {
      recipeName: null,
      recipeDescription: null,
      mealNotes: null,
    };

    if (!schoolId || !date || !mealType) {
      return empty;
    }

    const targetDate = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(targetDate.getTime())) {
      return empty;
    }

    try {
      const plan = await MealPlanSchema.findOne({
        schoolId,
        weekStartDate: { $lte: targetDate },
        weekEndDate: { $gte: targetDate },
      });

      if (!plan || !Array.isArray(plan.meals) || plan.meals.length === 0) {
        return empty;
      }

      const dayName = WEEKDAY_NAMES[targetDate.getUTCDay()];
      const normalizedMealType = String(mealType).trim().toLowerCase();

      const entry = plan.meals.find(
        (m) =>
          m.day === dayName &&
          String(m.mealType).trim().toLowerCase() === normalizedMealType
      );

      if (!entry) {
        return empty;
      }

      let recipeDescription = null;
      if (entry.recipeId) {
        try {
          const recipe = await RecipeSchema.findById(entry.recipeId).select(
            'description'
          );
          recipeDescription = recipe?.description ?? null;
        } catch {
          // Recipe lookup is best-effort; don't break if it fails.
        }
      }

      return {
        recipeName: entry.recipeName || null,
        recipeDescription,
        mealNotes: entry.notes || null,
      };
    } catch {
      return empty;
    }
  }
}

// Immutable value object representing a single meal in a meal plan
class MealEntry {
  constructor({ day, mealType, recipeId, recipeName, plannedServings, notes }) {
    if (!day) {
      throw new Error('Day is required for meal entry');
    }

    if (!mealType) {
      throw new Error('Meal type is required');
    }

    if (!recipeId) {
      throw new Error('Recipe ID is required');
    }

    if (!plannedServings || plannedServings <= 0) {
      throw new Error('Planned servings must be greater than 0');
    }
    this.day = day;
    this.mealType = mealType;
    this.recipeId = recipeId;
    this.recipeName = recipeName || '';
    this.plannedServings = plannedServings;
    this.notes = notes || '';
    Object.freeze(this);
  }

  // Checks if meal is scheduled for the given day
  isForDay(day) {
    return this.day === day;
  }

  isBreakfast() {
    return this.mealType === 'breakfast';
  }

  isLunch() {
    return this.mealType === 'lunch';
  }

  // Returns a formatted "Day MealType" string
  getMealIdentifier() {
    return `${this.day} ${this.mealType}`;
  }

  // Returns a new MealEntry with updated servings
  withUpdatedServings(newServings) {
    return new MealEntry({
      day: this.day,
      mealType: this.mealType,
      recipeId: this.recipeId,
      recipeName: this.recipeName,
      plannedServings: newServings,
      notes: this.notes,
    });
  }
}

export default MealEntry;

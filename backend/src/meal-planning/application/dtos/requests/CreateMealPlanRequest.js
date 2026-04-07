class CreateMealPlanRequest {
  constructor(body) {
    this.schoolId = body.schoolId;
    this.schoolName = body.schoolName || '';
    this.weekStartDate = body.weekStartDate;
    this.weekEndDate = body.weekEndDate;
    this.meals = body.meals || [];
    this.createdBy = body.createdBy;
  }

  // Returns array of validation error messages, empty if valid
  validate() {
    const errors = [];

    if (!this.schoolId) {
      errors.push('School ID is required');
    }

    if (!this.weekStartDate) {
      errors.push('Week start date is required');
    }

    if (!this.weekEndDate) {
      errors.push('Week end date is required');
    }

    if (!this.meals || this.meals.length === 0) {
      errors.push('At least one meal is required');
    }

    this.meals.forEach((meal, index) => {
      if (!meal.day) {
        errors.push(`Meal ${index + 1}: day is required`);
      }

      if (!meal.mealType) {
        errors.push(`Meal ${index + 1}: meal type is required`);
      }

      if (!meal.recipeId) {
        errors.push(`Meal ${index + 1}: recipe ID is required`);
      }

      if (!meal.plannedServings || meal.plannedServings <= 0) {
        errors.push(`Meal ${index + 1}: valid planned servings required`);
      }
    });

    return errors;
  }
}

export default CreateMealPlanRequest;

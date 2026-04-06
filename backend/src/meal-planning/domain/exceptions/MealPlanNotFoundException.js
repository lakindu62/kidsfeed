class MealPlanNotFoundException extends Error {
  constructor(id) {
    super(`Meal plan with ID ${id} not found`);
    this.name = 'MealPlanNotFoundException';
    this.statusCode = 404;
  }
}

export default MealPlanNotFoundException;

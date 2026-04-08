class MealPlanResponse {
  constructor(mealPlan) {
    this.id = mealPlan.id;
    this.schoolId = mealPlan.schoolId;
    this.schoolName = mealPlan.schoolName;
    this.weekStartDate = mealPlan.weekStartDate;
    this.weekEndDate = mealPlan.weekEndDate;

    this.meals = mealPlan.meals.map((m) => ({
      day: m.day,
      mealType: m.mealType,
      recipeId: m.recipeId,
      recipeName: m.recipeName,
      plannedServings: m.plannedServings,
      notes: m.notes,
    }));

    this.status = mealPlan.status;
    this.inventoryChecked = mealPlan.inventoryChecked;
    this.totalPlannedServings = mealPlan.getTotalPlannedServings();
    this.isCurrentWeek = mealPlan.isCurrentWeek();
    this.createdAt = mealPlan.createdAt;
    this.updatedAt = mealPlan.updatedAt;
  }
}

export default MealPlanResponse;

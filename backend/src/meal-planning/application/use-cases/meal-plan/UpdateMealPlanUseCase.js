import MealPlan from '../../../domain/entities/MealPlan.js';
import MealEntry from '../../../domain/value-objects/MealEntry.js';
import MealPlanNotFoundException from '../../../domain/exceptions/MealPlanNotFoundException.js';

class UpdateMealPlanUseCase {
  constructor(mealPlanRepository) {
    this.mealPlanRepository = mealPlanRepository;
  }

  async execute(mealPlanId, updateData) {
    const existingMealPlan = await this.mealPlanRepository.findById(mealPlanId);
    if (!existingMealPlan) {
      throw new MealPlanNotFoundException(mealPlanId);
    }

    const meals = updateData.meals
      ? updateData.meals.map(
          (m) =>
            new MealEntry({
              day: m.day,
              mealType: m.mealType,
              recipeId: m.recipeId,
              recipeName: m.recipeName,
              plannedServings: m.plannedServings,
              notes: m.notes,
            })
        )
      : existingMealPlan.meals;

    const updatedMealPlan = new MealPlan({
      id: mealPlanId,
      schoolId: updateData.schoolId ?? existingMealPlan.schoolId,
      schoolName: updateData.schoolName ?? existingMealPlan.schoolName,
      weekStartDate: updateData.weekStartDate ?? existingMealPlan.weekStartDate,
      weekEndDate: updateData.weekEndDate ?? existingMealPlan.weekEndDate,
      meals,
      status: updateData.status ?? existingMealPlan.status,
      createdBy: existingMealPlan.createdBy,
      inventoryChecked:
        updateData.inventoryChecked ?? existingMealPlan.inventoryChecked,
      createdAt: existingMealPlan.createdAt,
      updatedAt: new Date(),
    });

    updatedMealPlan.validate();
    return await this.mealPlanRepository.update(mealPlanId, updatedMealPlan);
  }
}

export default UpdateMealPlanUseCase;

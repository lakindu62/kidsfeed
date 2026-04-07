import MealPlan from '../../../domain/entities/MealPlan.js';
import MealEntry from '../../../domain/value-objects/MealEntry.js';

// Creates a new weekly meal plan for a school
class CreateMealPlanUseCase {
  constructor(mealPlanRepository) {
    this.mealPlanRepository = mealPlanRepository;
  }

  async execute(mealPlanData) {
    const meals = mealPlanData.meals.map(
      (m) =>
        new MealEntry({
          day: m.day,
          mealType: m.mealType,
          recipeId: m.recipeId,
          recipeName: m.recipeName,
          plannedServings: m.plannedServings,
          notes: m.notes,
        })
    );

    const mealPlan = new MealPlan({
      schoolId: mealPlanData.schoolId,
      schoolName: mealPlanData.schoolName,
      weekStartDate: mealPlanData.weekStartDate,
      weekEndDate: mealPlanData.weekEndDate,
      meals: meals,
      status: 'planned',
      createdBy: mealPlanData.createdBy,
      inventoryChecked: false,
    });

    mealPlan.validate();

    const savedMealPlan = await this.mealPlanRepository.save(mealPlan);
    return savedMealPlan;
  }
}

export default CreateMealPlanUseCase;

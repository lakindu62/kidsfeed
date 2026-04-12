import MealPlanNotFoundException from '../../../domain/exceptions/MealPlanNotFoundException.js';

// Retrieves a meal plan by ID or throws if not found
class GetMealPlanUseCase {
  constructor(mealPlanRepository) {
    this.mealPlanRepository = mealPlanRepository;
  }

  async execute(mealPlanId) {
    const mealPlan = await this.mealPlanRepository.findById(mealPlanId);

    if (!mealPlan) {
      throw new MealPlanNotFoundException(mealPlanId);
    }

    return mealPlan;
  }
}

export default GetMealPlanUseCase;

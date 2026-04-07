import MealPlanNotFoundException from '../../../domain/exceptions/MealPlanNotFoundException.js';

class DeleteMealPlanUseCase {
  constructor(mealPlanRepository) {
    this.mealPlanRepository = mealPlanRepository;
  }

  async execute(mealPlanId) {
    const mealPlan = await this.mealPlanRepository.delete(mealPlanId);

    if (!mealPlan) {
      throw new MealPlanNotFoundException(mealPlanId);
    }

    return mealPlan;
  }
}

export default DeleteMealPlanUseCase;

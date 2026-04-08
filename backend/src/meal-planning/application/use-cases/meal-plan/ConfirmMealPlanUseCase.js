import MealPlanNotFoundException from '../../../domain/exceptions/MealPlanNotFoundException.js';

class ConfirmMealPlanUseCase {
  constructor(mealPlanRepository) {
    this.mealPlanRepository = mealPlanRepository;
  }

  // Transitions meal plan status from 'planned' to 'confirmed'
  async execute(mealPlanId) {
    const mealPlan = await this.mealPlanRepository.findById(mealPlanId);

    if (!mealPlan) {
      throw new MealPlanNotFoundException(mealPlanId);
    }

    mealPlan.confirm();

    return await this.mealPlanRepository.update(mealPlanId, mealPlan);
  }
}

export default ConfirmMealPlanUseCase;

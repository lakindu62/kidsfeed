import MealPlanNotFoundException from '../../../domain/exceptions/MealPlanNotFoundException.js';
import InvalidMealPlanException from '../../../domain/exceptions/InvalidMealPlanException.js';

class DeleteMealPlanUseCase {
  constructor(mealPlanRepository) {
    this.mealPlanRepository = mealPlanRepository;
  }

  async execute(mealPlanId) {
    const mealPlan = await this.mealPlanRepository.findById(mealPlanId);

    if (!mealPlan) {
      throw new MealPlanNotFoundException(mealPlanId);
    }

    if (
      String(mealPlan.status || '')
        .trim()
        .toLowerCase() === 'draft'
    ) {
      throw new InvalidMealPlanException('Draft meal plans cannot be deleted');
    }

    const deletedMealPlan = await this.mealPlanRepository.delete(mealPlanId);

    if (!deletedMealPlan) {
      throw new MealPlanNotFoundException(mealPlanId);
    }

    return deletedMealPlan;
  }
}

export default DeleteMealPlanUseCase;

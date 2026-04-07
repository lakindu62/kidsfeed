// Use case: validates a list of ingredients and calculates their aggregated nutrition
class CalculateNutritionUseCase {
  /**
   * @param {NutritionService} nutritionService
   */
  constructor(nutritionService) {
    this.nutritionService = nutritionService;
  }

  async execute(ingredients) {
    if (!ingredients || ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    for (const ingredient of ingredients) {
      if (!ingredient.name || !ingredient.quantity || !ingredient.unit) {
        throw new Error('Each ingredient must have name, quantity and unit');
      }

      if (ingredient.quantity <= 0) {
        throw new Error('Ingredient quantity must be greater than 0');
      }
    }

    return await this.nutritionService.calculate(ingredients);
  }
}

export default CalculateNutritionUseCase;

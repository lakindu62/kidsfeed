import NutritionalInfo from '../../domain/value-objects/NutritionalInfo.js';

// Application-layer adapter: validates ingredients and delegates to an external nutrition API service
class NutritionService {
  /**
   * @param {Object} nutritionApiService - Service with a calculate(ingredients) method
   */
  constructor(nutritionApiService) {
    this.nutritionApiService = nutritionApiService;
  }

  // Returns a NutritionalInfo value object for the given ingredient list
  async calculate(ingredients) {
    if (!ingredients || ingredients.length === 0) {
      throw new Error(
        'At least one ingredient is required for nutrition calculation'
      );
    }

    const nutritionData = await this.nutritionApiService.calculate(ingredients);
    return new NutritionalInfo(nutritionData);
  }
}

export default NutritionService;

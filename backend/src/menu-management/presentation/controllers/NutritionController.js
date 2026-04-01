import NutritionResponse from '../../application/dtos/responses/NutritionResponse.js';

// HTTP controller for nutrition calculation endpoint
class NutritionController {
  /**
   * @param {Object} dependencies
   * @param {CalculateNutritionUseCase} dependencies.calculateNutritionUseCase
   */
  constructor({ calculateNutritionUseCase }) {
    this.calculateNutritionUseCase = calculateNutritionUseCase;
  }

  // POST /api/nutrition/calculate
  async calculateNutrition(req, res, next) {
    try {
      const { ingredients } = req.body;

      if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({
          success: false,
          error: 'Ingredients array is required',
        });
      }

      if (ingredients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one ingredient is required',
        });
      }

      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];

        if (!ing.name || !ing.quantity || !ing.unit) {
          return res.status(400).json({
            success: false,
            error: `Ingredient ${i + 1}: name, quantity and unit are required`,
          });
        }

        if (ing.quantity <= 0) {
          return res.status(400).json({
            success: false,
            error: `Ingredient ${i + 1}: quantity must be greater than 0`,
          });
        }
      }

      const nutritionalInfo =
        await this.calculateNutritionUseCase.execute(ingredients);

      res.status(200).json({
        success: true,
        message: 'Nutrition calculated successfully',
        data: new NutritionResponse(nutritionalInfo),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NutritionController;

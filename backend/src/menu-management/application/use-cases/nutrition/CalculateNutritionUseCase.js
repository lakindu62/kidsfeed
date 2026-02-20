/**
 * CalculateNutritionUseCase
 *
 * Application service responsible for orchestrating nutritional information
 * calculations for ingredient lists. This use case implements the Command pattern
 * from Clean Architecture, encapsulating the business logic for validating
 * ingredients and calculating their aggregated nutritional values.
 *
 * Responsibilities:
 * 1. Validate that at least one ingredient is provided
 * 2. Validate each ingredient has all required fields (name, quantity, unit)
 * 3. Validate that all quantities are positive values
 * 4. Delegate calculation to the nutrition service
 * 5. Return the calculated NutritionalInfo value object
 *
 * Validation Strategy:
 * This use case enforces strict validation at the application layer to ensure
 * data integrity before expensive external API calls are made. It provides
 * clear, actionable error messages for each validation failure.
 *
 * Use Cases:
 * - Calculate nutrition for a new recipe during creation
 * - Recalculate nutrition when recipe ingredients are updated
 * - Preview nutrition for ingredient combinations
 * - Standalone nutrition calculator features
 *
 * This use case is independent of the delivery mechanism (REST API, GraphQL, CLI),
 * making it reusable across different interfaces and easy to test in isolation.
 *
 * @class CalculateNutritionUseCase
 * @module menu-management/application/use-cases/nutrition/CalculateNutritionUseCase
 *
 * @example
 * const useCase = new CalculateNutritionUseCase(nutritionService);
 *
 * const ingredients = [
 *   { name: 'chicken breast', quantity: 200, unit: 'g' },
 *   { name: 'brown rice', quantity: 150, unit: 'g' },
 *   { name: 'broccoli', quantity: 100, unit: 'g' }
 * ];
 *
 * const nutrition = await useCase.execute(ingredients);
 * console.log(nutrition.calories);  // Total calories
 * console.log(nutrition.protein);   // Total protein
 */
class CalculateNutritionUseCase {
  /**
   * Initializes the use case with required dependencies
   *
   * @constructor
   * @param {NutritionService} nutritionService - Service for calculating nutritional information
   *
   * @example
   * const usdaService = new USDANutritionService();
   * const nutritionService = new NutritionService(usdaService);
   * const useCase = new CalculateNutritionUseCase(nutritionService);
   */
  constructor(nutritionService) {
    /**
     * Service for calculating nutritional information
     * Acts as an adapter to external nutrition APIs
     * @type {NutritionService}
     * @private
     */
    this.nutritionService = nutritionService;
  }

  /**
   * Executes the nutrition calculation workflow
   *
   * Orchestrates the following steps:
   * 1. Validates that the ingredients array is not empty
   * 2. Validates each ingredient has all required fields
   * 3. Validates that all quantities are positive numbers
   * 4. Delegates calculation to the nutrition service
   * 5. Returns the calculated NutritionalInfo value object
   *
   * This use case performs comprehensive validation to catch data issues early
   * and provide clear error messages, preventing expensive API calls with
   * invalid data and improving the user experience.
   *
   * @async
   * @param {Array<Object>} ingredients - List of ingredient objects to calculate nutrition for
   * @param {string} ingredients[].name - Name of the ingredient (required, non-empty)
   * @param {number} ingredients[].quantity - Amount of the ingredient (required, > 0)
   * @param {string} ingredients[].unit - Unit of measurement (required, e.g., 'g', 'kg', 'cup')
   * @returns {Promise<NutritionalInfo>} Immutable NutritionalInfo value object with aggregated nutrition
   * @throws {Error} If ingredients array is empty, null, or undefined
   * @throws {Error} If any ingredient is missing name, quantity, or unit
   * @throws {Error} If any ingredient has a quantity <= 0
   * @throws {Error} If the nutrition service fails (API errors, network issues)
   *
   * @example
   * // Successful calculation
   * const ingredients = [
   *   { name: 'salmon', quantity: 150, unit: 'g' },
   *   { name: 'quinoa', quantity: 100, unit: 'g' }
   * ];
   *
   * const nutrition = await calculateNutritionUseCase.execute(ingredients);
   * console.log(nutrition.calories);           // e.g., 480
   * console.log(nutrition.protein);            // e.g., 42
   * console.log(nutrition.getTotalMacros());   // e.g., 62
   * console.log(nutrition.isHighProtein());    // true (> 20g)
   *
   * @example
   * // Empty ingredients array error
   * try {
   *   await calculateNutritionUseCase.execute([]);
   * } catch (error) {
   *   console.log(error.message);
   *   // 'At least one ingredient is required'
   * }
   *
   * @example
   * // Missing required field error
   * try {
   *   await calculateNutritionUseCase.execute([
   *     { name: 'chicken', quantity: 200 } // Missing 'unit'
   *   ]);
   * } catch (error) {
   *   console.log(error.message);
   *   // 'Each ingredient must have name, quantity and unit'
   * }
   *
   * @example
   * // Invalid quantity error
   * try {
   *   await calculateNutritionUseCase.execute([
   *     { name: 'rice', quantity: -50, unit: 'g' }
   *   ]);
   * } catch (error) {
   *   console.log(error.message);
   *   // 'Ingredient quantity must be greater than 0'
   * }
   *
   * @example
   * // Use in CreateRecipeUseCase
   * if (this.nutritionService && recipe.ingredients.length > 0) {
   *   try {
   *     const nutritionData = await calculateNutritionUseCase.execute(
   *       recipe.ingredients
   *     );
   *     recipe.updateNutrition(nutritionData);
   *   } catch (error) {
   *     console.warn('Nutrition calculation failed:', error.message);
   *     // Continue recipe creation without nutrition data
   *   }
   * }
   */
  async execute(ingredients) {
    // Step 1: Validate that at least one ingredient is provided
    // Prevents unnecessary processing and provides clear feedback
    if (!ingredients || ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    // Step 2-3: Validate each ingredient's structure and values
    // Iterate through all ingredients to check for data integrity issues
    for (const ingredient of ingredients) {
      // Validate that all required fields are present
      // This prevents API calls with incomplete data
      if (!ingredient.name || !ingredient.quantity || !ingredient.unit) {
        throw new Error('Each ingredient must have name, quantity and unit');
      }

      // Validate that quantity is a positive number
      // Negative or zero quantities don't make sense in a recipe context
      if (ingredient.quantity <= 0) {
        throw new Error('Ingredient quantity must be greater than 0');
      }
    }

    // Step 4: All validations passed - delegate calculation to the nutrition service
    // The service will handle API calls and return a NutritionalInfo value object
    return await this.nutritionService.calculate(ingredients);
  }
}

export default CalculateNutritionUseCase;

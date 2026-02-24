/**
 * NutritionService
 *
 * Application-layer service that acts as an adapter between the domain layer
 * and external nutrition API services. This service implements the Adapter Pattern,
 * providing a stable interface for nutrition calculations while isolating the domain
 * from external API dependencies and implementation details.
 *
 * Architecture Role:
 * - **Application Layer**: Orchestrates the interaction between domain and infrastructure
 * - **Adapter**: Translates between external API data format and domain value objects
 * - **Abstraction**: Allows the domain to remain independent of specific API implementations
 *
 * Responsibilities:
 * 1. Validate ingredient input before making API calls
 * 2. Delegate the actual calculation to the configured API service (e.g., USDA)
 * 3. Transform the raw API response into a NutritionalInfo value object
 * 4. Ensure the domain receives properly structured, immutable nutrition data
 *
 * Benefits:
 * - Domain layer doesn't know about USDA API or any specific implementation
 * - Easy to swap nutrition providers (USDA → Nutritionix → custom) without affecting domain
 * - Centralized validation and error handling for nutrition operations
 * - Type safety through value object conversion
 *
 * @class NutritionService
 * @module menu-management/application/services/NutritionService
 *
 * @example
 * // Using with USDA API service
 * const usdaService = new USDANutritionService();
 * const nutritionService = new NutritionService(usdaService);
 *
 * const ingredients = [
 *   { name: 'chicken breast', quantity: 200, unit: 'g' },
 *   { name: 'brown rice', quantity: 150, unit: 'g' }
 * ];
 *
 * const nutritionalInfo = await nutritionService.calculate(ingredients);
 * console.log(nutritionalInfo.calories);    // e.g., 450
 * console.log(nutritionalInfo.protein);     // e.g., 55
 * console.log(nutritionalInfo instanceof NutritionalInfo); // true
 *
 * @example
 * // Easy to swap API providers without changing domain code
 * const nutritionixService = new NutritionixAPIService();
 * const nutritionService = new NutritionService(nutritionixService);
 * // Same interface, different implementation
 */
import NutritionalInfo from '../../domain/value-objects/NutritionalInfo.js';

class NutritionService {
  /**
   * Initializes the nutrition service with a specific API implementation
   *
   * The service accepts any nutrition API implementation that provides a
   * calculate(ingredients) method, following the Dependency Inversion Principle.
   * This allows for flexible configuration and easy testing with mock services.
   *
   * @constructor
   * @param {Object} nutritionApiService - External nutrition API service implementation
   * @param {Function} nutritionApiService.calculate - Method that takes ingredients and returns nutrition data
   *
   * @example
   * // Production usage with USDA API
   * const usdaService = new USDANutritionService();
   * const service = new NutritionService(usdaService);
   *
   * @example
   * // Testing usage with mock service
   * const mockApiService = {
   *   calculate: async (ingredients) => ({
   *     calories: 100,
   *     protein: 10,
   *     carbs: 15,
   *     fats: 5,
   *     fiber: 2,
   *     sugar: 3
   *   })
   * };
   * const service = new NutritionService(mockApiService);
   */
  constructor(nutritionApiService) {
    /**
     * External nutrition API service (e.g., USDANutritionService)
     * Responsible for fetching raw nutritional data from external sources
     * @type {Object}
     * @private
     */
    this.nutritionApiService = nutritionApiService;
  }

  /**
   * Calculates aggregated nutritional information for a list of ingredients
   *
   * Orchestrates the nutrition calculation workflow:
   * 1. Validates that ingredients are provided
   * 2. Delegates calculation to the configured API service
   * 3. Transforms the raw API response into a NutritionalInfo value object
   * 4. Returns an immutable, domain-ready nutrition object
   *
   * The returned NutritionalInfo value object is immutable and includes
   * domain-level methods for nutritional analysis (e.g., isHighProtein()).
   *
   * @async
   * @param {Array<Object>} ingredients - List of ingredient objects with quantities
   * @param {string} ingredients[].name - Name of the ingredient (e.g., 'chicken breast')
   * @param {number} ingredients[].quantity - Amount of the ingredient
   * @param {string} ingredients[].unit - Unit of measurement (g, kg, cup, tbsp, etc.)
   * @returns {Promise<NutritionalInfo>} Immutable NutritionalInfo value object with aggregated nutrition
   * @throws {Error} If ingredients array is empty, null, or undefined
   * @throws {Error} If the nutrition API service fails (network, API limits, invalid ingredients)
   *
   * @example
   * // Calculate nutrition for a recipe
   * const ingredients = [
   *   { name: 'oats', quantity: 50, unit: 'g' },
   *   { name: 'banana', quantity: 1, unit: 'piece' },
   *   { name: 'milk', quantity: 200, unit: 'ml' }
   * ];
   *
   * const nutrition = await nutritionService.calculate(ingredients);
   * console.log(nutrition.calories);           // e.g., 350
   * console.log(nutrition.getCaloriesFromProtein()); // e.g., 48
   * console.log(nutrition.isHighProtein());    // false (< 20g)
   *
   * @example
   * // Validation error handling
   * try {
   *   await nutritionService.calculate([]);
   * } catch (error) {
   *   console.log(error.message);
   *   // 'At least one ingredient is required for nutrition calculation'
   * }
   *
   * @example
   * // API error handling
   * try {
   *   const nutrition = await nutritionService.calculate(ingredients);
   * } catch (error) {
   *   console.error('Nutrition calculation failed:', error.message);
   *   // Could be: API rate limit, network error, ingredient not found, etc.
   *   // The service will propagate errors from the API service layer
   * }
   */
  async calculate(ingredients) {
    // Validate that at least one ingredient is provided before making API calls
    // This prevents unnecessary API requests and provides clear error messages
    if (!ingredients || ingredients.length === 0) {
      throw new Error(
        'At least one ingredient is required for nutrition calculation'
      );
    }

    // Delegate the actual calculation to the configured external API service
    // This could be USDA, Nutritionix, or any other nutrition data provider
    // The service returns raw nutrition data as a plain object
    const nutritionData = await this.nutritionApiService.calculate(ingredients);

    // Transform the raw API response into an immutable NutritionalInfo value object
    // This provides:
    // - Type safety and domain-level validation
    // - Immutability through Object.freeze()
    // - Domain methods (getCaloriesFromProtein, isHighProtein, etc.)
    // - Consistent structure regardless of API provider
    return new NutritionalInfo(nutritionData);
  }
}

export default NutritionService;

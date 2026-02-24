/**
 * NutritionController
 *
 * Presentation layer controller responsible for handling HTTP requests related
 * to nutritional information calculations. This class implements the Controller
 * pattern from Clean Architecture, providing a REST API endpoint for calculating
 * nutrition data from ingredient lists.
 *
 * Responsibilities:
 * 1. Parse and validate HTTP request body (ingredients array)
 * 2. Validate ingredient structure and values at the HTTP layer
 * 3. Orchestrate nutrition calculation use case execution
 * 4. Transform NutritionalInfo value object into response DTO
 * 5. Format HTTP responses with appropriate status codes
 * 6. Handle errors and delegate to error handling middleware
 *
 * Architecture Role:
 * - **Presentation Layer**: Interface between HTTP and application layer
 * - **Adapter**: Translates HTTP requests to use case inputs
 * - **Input Validator**: Performs HTTP-level validation before use case execution
 *
 * Validation Strategy:
 * This controller performs comprehensive HTTP-level validation to catch
 * malformed requests early and provide clear error messages. This prevents
 * expensive API calls to external nutrition services with invalid data.
 *
 * Validation includes:
 * - Ingredients array presence and type checking
 * - Non-empty ingredients array
 * - Each ingredient has required fields (name, quantity, unit)
 * - All quantities are positive numbers
 *
 * Error Handling Strategy:
 * - Validation errors return 400 Bad Request with specific error messages
 * - Use case errors (API failures, etc.) delegated to error middleware
 * - Unexpected errors delegated to Express error handling via next(error)
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "Nutrition calculated successfully",
 *   data: <NutritionResponse with calculated values>
 * }
 *
 * @class NutritionController
 * @module menu-management/presentation/controllers/NutritionController
 *
 * @example
 * // Initialize controller with use case (typically in dependency injection container)
 * const nutritionController = new NutritionController({
 *   calculateNutritionUseCase: new CalculateNutritionUseCase(nutritionService)
 * });
 *
 * @example
 * // Register route in Express
 * router.post('/nutrition/calculate',
 *   nutritionController.calculateNutrition.bind(nutritionController)
 * );
 *
 * @example
 * // Example API request
 * POST /api/nutrition/calculate
 * {
 *   "ingredients": [
 *     { "name": "chicken breast", "quantity": 200, "unit": "g" },
 *     { "name": "brown rice", "quantity": 150, "unit": "g" }
 *   ]
 * }
 *
 * // Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Nutrition calculated successfully",
 *   "data": {
 *     "calories": 450,
 *     "protein": 45,
 *     "carbs": 50,
 *     "fats": 8,
 *     "fiber": 5,
 *     "sugar": 2,
 *     "totalMacros": 103,
 *     "caloriesFromProtein": 180,
 *     "caloriesFromCarbs": 200,
 *     "caloriesFromFats": 72,
 *     "isHighProtein": true
 *   }
 * }
 */
import NutritionResponse from '../../application/dtos/responses/NutritionResponse.js';

class NutritionController {
  /**
   * Initializes the controller with required use case via dependency injection
   *
   * @constructor
   * @param {Object} dependencies - Object containing required use case
   * @param {CalculateNutritionUseCase} dependencies.calculateNutritionUseCase - Use case for calculating nutrition
   *
   * @example
   * const usdaService = new USDANutritionService();
   * const nutritionService = new NutritionService(usdaService);
   * const calculateUseCase = new CalculateNutritionUseCase(nutritionService);
   *
   * const controller = new NutritionController({
   *   calculateNutritionUseCase: calculateUseCase
   * });
   */
  constructor({ calculateNutritionUseCase }) {
    /**
     * Use case for calculating nutritional information from ingredients
     * @type {CalculateNutritionUseCase}
     * @private
     */
    this.calculateNutritionUseCase = calculateNutritionUseCase;
  }

  /**
   * Calculates nutritional information for a list of ingredients
   *
   * Handles POST /api/nutrition/calculate
   * Validates request body, executes calculation use case, returns nutrition data
   * with derived metrics (calorie breakdown, macros total, high-protein flag).
   *
   * This endpoint performs comprehensive validation to catch malformed requests
   * early, preventing expensive external API calls with invalid data. Validation
   * happens at both the HTTP layer (this controller) and application layer (use case).
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Object} req.body - Request body
   * @param {Array<Object>} req.body.ingredients - List of ingredients to calculate nutrition for
   * @param {string} req.body.ingredients[].name - Ingredient name (required)
   * @param {number} req.body.ingredients[].quantity - Ingredient quantity (required, > 0)
   * @param {string} req.body.ingredients[].unit - Measurement unit (required)
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   *
   * @throws {400} If ingredients array is missing, not an array, or empty
   * @throws {400} If any ingredient is missing required fields (name, quantity, unit)
   * @throws {400} If any ingredient has quantity <= 0
   * @throws {500} If calculation fails due to API errors or unexpected issues
   *
   * @example
   * // POST /api/nutrition/calculate
   * // Valid request:
   * {
   *   "ingredients": [
   *     { "name": "oats", "quantity": 50, "unit": "g" },
   *     { "name": "banana", "quantity": 1, "unit": "piece" },
   *     { "name": "milk", "quantity": 200, "unit": "ml" }
   *   ]
   * }
   *
   * // Response (200 OK):
   * {
   *   "success": true,
   *   "message": "Nutrition calculated successfully",
   *   "data": {
   *     "calories": 350,
   *     "protein": 12,
   *     "carbs": 55,
   *     "fats": 8,
   *     "fiber": 7,
   *     "sugar": 15,
   *     "totalMacros": 75,
   *     "caloriesFromProtein": 48,
   *     "caloriesFromCarbs": 220,
   *     "caloriesFromFats": 72,
   *     "isHighProtein": false
   *   }
   * }
   *
   * @example
   * // Invalid request - missing ingredients array:
   * {}
   * // Response (400 Bad Request):
   * {
   *   "success": false,
   *   "error": "Ingredients array is required"
   * }
   *
   * @example
   * // Invalid request - invalid ingredient structure:
   * {
   *   "ingredients": [
   *     { "name": "pasta", "quantity": -10, "unit": "g" }
   *   ]
   * }
   * // Response (400 Bad Request):
   * {
   *   "success": false,
   *   "error": "Ingredient 1: ingredient must be greater than 0"
   * }
   */
  async calculateNutrition(req, res, next) {
    try {
      // Step 1: Extract ingredients from request body
      const { ingredients } = req.body;

      // Step 2: Validate that ingredients array is provided and is actually an array
      if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({
          success: false,
          error: 'Ingredients array is required',
        });
      }

      // Step 3: Validate that at least one ingredient is provided
      // Empty arrays would result in meaningless calculations
      if (ingredients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one ingredient is required',
        });
      }

      // Step 4: Validate each ingredient's structure and values
      // Use traditional for loop to provide index-specific error messages
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];

        // Validate that all required fields are present
        if (!ing.name || !ing.quantity || !ing.unit) {
          return res.status(400).json({
            success: false,
            error: `Ingredient ${i + 1}: name, quantity and unit are required`,
          });
        }

        // Validate that quantity is a positive number
        // Zero or negative quantities don't make sense in a recipe context
        if (ing.quantity <= 0) {
          return res.status(400).json({
            success: false,
            // BUG: Error message typo - "ingredient must be greater than 0"
            error: `Ingredient ${i + 1}: quantity must be greater than 0`,
          });
        }
      }

      // Step 5: All validations passed - execute the calculation use case
      // This will call external APIs (e.g., USDA) to fetch nutrition data
      const nutritionalInfo =
        await this.calculateNutritionUseCase.execute(ingredients);

      // Step 6: Transform NutritionalInfo value object into response DTO
      // This unwraps the value object and adds pre-calculated derived metrics
      const response = new NutritionResponse(nutritionalInfo);

      // Step 7: Return 200 OK with the calculated nutrition data
      res.status(200).json({
        success: true,
        message: 'Nutrition calculated successfully',
        data: response, // Includes calories, macros, derived values, flags
      });
    } catch (error) {
      // Delegate error handling to Express error middleware
      // This includes API failures, network errors, and unexpected exceptions
      next(error);
    }
  }
}

export default NutritionController;

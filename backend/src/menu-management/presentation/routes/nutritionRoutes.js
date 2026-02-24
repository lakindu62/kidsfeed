/**
 * Nutrition Routes Configuration
 *
 * Defines HTTP routes for nutrition-related operations and maps them to
 * controller methods. This module implements the Router factory pattern,
 * creating an Express router configured with dependency injection.
 *
 * Route Design:
 * - Single endpoint for nutrition calculation
 * - RESTful POST method for resource creation (calculation results)
 * - Clean separation between routing and controller logic
 * - Stateless design (no calculation persistence)
 *
 * Responsibilities:
 * 1. Define URL pattern for nutrition calculation endpoint
 * 2. Map HTTP POST method to controller method
 * 3. Preserve 'this' context for controller method via arrow function
 * 4. Support dependency injection for testability
 * 5. Return configured Express Router instance
 *
 * Dependency Injection:
 * This factory function accepts a controller instance, enabling:
 * - Easy unit testing with mock controllers
 * - Flexible configuration in different environments
 * - Clear dependency declaration
 * - Simplified integration with DI containers
 *
 * Use Cases:
 * - Standalone nutrition calculator feature
 * - Recipe creation with nutrition preview
 * - Nutrition comparison between ingredient combinations
 * - Meal planning nutritional analysis
 * - Educational tools for nutrition awareness
 *
 * @module menu-management/presentation/routes/nutritionRoutes
 * @function createNutritionRoutes
 * @param {NutritionController} nutritionController - Controller instance with nutrition calculation method
 * @returns {express.Router} Configured Express router with nutrition routes
 *
 * @example
 * // Create routes with controller instance
 * import createNutritionRoutes from './routes/nutritionRoutes';
 * import NutritionController from './controllers/NutritionController';
 *
 * const nutritionController = new NutritionController({
 *   calculateNutritionUseCase
 * });
 *
 * const nutritionRouter = createNutritionRoutes(nutritionController);
 * app.use('/api/nutrition', nutritionRouter);
 *
 * @example
 * // Available endpoint after mounting at /api/nutrition:
 * // POST /api/nutrition/calculate - Calculate nutrition for ingredient list
 *
 * @example
 * // Full integration example
 * import express from 'express';
 * import createNutritionRoutes from './routes/nutritionRoutes';
 *
 * const app = express();
 * app.use(express.json());
 *
 * // Mount nutrition routes
 * const nutritionRouter = createNutritionRoutes(nutritionController);
 * app.use('/api/nutrition', nutritionRouter);
 *
 * // Result: POST /api/nutrition/calculate endpoint is now available
 *
 * @see {@link https://expressjs.com/en/guide/routing.html|Express Routing Guide}
 */
import express from 'express';

/**
 * Factory function that creates and configures the nutrition router
 *
 * Creates an Express Router instance with a single endpoint for calculating
 * nutritional information from a list of ingredients. The calculation is
 * stateless and does not persist results.
 *
 * @param {NutritionController} nutritionController - Controller with nutrition calculation method
 * @returns {express.Router} Configured Express router instance
 *
 * @example
 * const router = createNutritionRoutes(nutritionController);
 */
const createNutritionRoutes = (nutritionController) => {
  // Create a new Express Router instance for nutrition routes
  const router = express.Router();

  /**
   * POST /calculate - Calculate nutritional information for ingredients
   *
   * Accepts a list of ingredients with quantities and units, then calculates
   * aggregated nutritional data using external nutrition APIs (e.g., USDA).
   *
   * Request Body:
   * {
   *   "ingredients": [
   *     {
   *       "name": "chicken breast",
   *       "quantity": 200,
   *       "unit": "g"
   *     },
   *     {
   *       "name": "brown rice",
   *       "quantity": 150,
   *       "unit": "g"
   *     }
   *   ]
   * }
   *
   * Response (200 OK):
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
   *
   * Validation:
   * - Ingredients array must be provided
   * - Array must contain at least one ingredient
   * - Each ingredient must have: name, quantity (> 0), and unit
   *
   * Error Responses:
   * - 400 Bad Request: Invalid or missing ingredients, validation failures
   * - 500 Internal Server Error: API failures, network errors, unexpected issues
   *
   * @example
   * POST /api/nutrition/calculate
   * Content-Type: application/json
   *
   * {
   *   "ingredients": [
   *     { "name": "oats", "quantity": 50, "unit": "g" },
   *     { "name": "banana", "quantity": 1, "unit": "piece" },
   *     { "name": "almond milk", "quantity": 200, "unit": "ml" }
   *   ]
   * }
   *
   * @example
   * // Using with fetch API (client-side)
   * const response = await fetch('/api/nutrition/calculate', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({
   *     ingredients: [
   *       { name: 'chicken breast', quantity: 200, unit: 'g' },
   *       { name: 'quinoa', quantity: 100, unit: 'g' }
   *     ]
   *   })
   * });
   * const data = await response.json();
   * console.log(data.data.calories); // e.g., 380
   *
   * @example
   * // Error response example (400 Bad Request)
   * {
   *   "success": false,
   *   "error": "Ingredient 2: quantity must be greater than 0"
   * }
   */
  router.post('/calculate', (req, res, next) =>
    nutritionController.calculateNutrition(req, res, next)
  );

  // Return the fully configured router
  return router;
};

export default createNutritionRoutes;

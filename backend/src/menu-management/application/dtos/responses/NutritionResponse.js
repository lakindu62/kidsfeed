/**
 * NutritionResponse
 *
 * Data Transfer Object (DTO) that represents the outgoing response payload
 * for nutritional information sent to clients. This class implements the DTO
 * pattern, transforming the NutritionalInfo value object into a client-friendly
 * format with pre-calculated derived values.
 *
 * Responsibilities:
 * 1. Extract raw nutritional data from the NutritionalInfo value object
 * 2. Pre-calculate and include derived metrics (macros breakdown, calorie sources)
 * 3. Include convenience flags (e.g., isHighProtein) for client-side logic
 * 4. Provide a consistent, rich response structure for nutrition queries
 * 5. Convert the immutable value object into a plain, serializable format
 *
 * Design Benefits:
 * - Enriches the response with calculated values, reducing client-side computation
 * - Provides a complete nutritional profile in a single response
 * - Decouples API response format from domain value object structure
 * - Makes nutrition data more actionable for clients (apps, dashboards)
 * - Improves client performance by pre-calculating common derived values
 *
 * Use Cases:
 * - Standalone nutrition calculator API endpoint
 * - Nutrition preview during recipe creation/editing
 * - Nutrition comparison between recipes
 * - Meal planning nutritional analysis
 * - Dietary tracking and reporting
 *
 * Derived Metrics Included:
 * - Total macronutrients (protein + carbs + fats)
 * - Calorie breakdown by macronutrient source
 * - High-protein flag for dietary filtering
 *
 * @class NutritionResponse
 * @module menu-management/application/dtos/responses/NutritionResponse
 *
 * @example
 * // Using in a nutrition calculator endpoint
 * app.post('/api/nutrition/calculate', async (req, res) => {
 *   const ingredients = req.body.ingredients;
 *   const nutritionalInfo = await calculateNutritionUseCase.execute(ingredients);
 *   const response = new NutritionResponse(nutritionalInfo);
 *   res.json(response);
 * });
 *
 * @example
 * // Response structure with derived values
 * {
 *   "calories": 450,
 *   "protein": 35,
 *   "carbs": 45,
 *   "fats": 12,
 *   "fiber": 8,
 *   "sugar": 10,
 *   "totalMacros": 92,           // Calculated: 35 + 45 + 12
 *   "caloriesFromProtein": 140,  // Calculated: 35 * 4
 *   "caloriesFromCarbs": 180,    // Calculated: 45 * 4
 *   "caloriesFromFats": 108,     // Calculated: 12 * 9
 *   "isHighProtein": true        // Calculated: 35 > 20
 * }
 */
class NutritionResponse {
  /**
   * Constructs a NutritionResponse DTO from a NutritionalInfo value object
   *
   * Extracts all raw nutritional data and pre-calculates derived metrics
   * using the value object's domain methods. This provides clients with
   * a complete nutritional profile including:
   * - Base nutritional values (calories, macros, fiber, sugar)
   * - Calculated totals (total macronutrients)
   * - Calorie breakdowns by macronutrient source
   * - Convenience flags for dietary classification
   *
   * The pre-calculation strategy reduces client-side computation and ensures
   * consistent calculations across all clients (web, mobile, etc.).
   *
   * @constructor
   * @param {NutritionalInfo} nutritionalInfo - NutritionalInfo value object to transform
   * @param {number} nutritionalInfo.calories - Total calories in kcal
   * @param {number} nutritionalInfo.protein - Protein content in grams
   * @param {number} nutritionalInfo.carbs - Carbohydrate content in grams
   * @param {number} nutritionalInfo.fats - Fat content in grams
   * @param {number} nutritionalInfo.fiber - Dietary fiber in grams
   * @param {number} nutritionalInfo.sugar - Sugar content in grams
   * @param {Function} nutritionalInfo.getTotalMacros - Method to calculate total macronutrients
   * @param {Function} nutritionalInfo.getCaloriesFromProtein - Method to calculate protein calories
   * @param {Function} nutritionalInfo.getCaloriesFromCarbs - Method to calculate carb calories
   * @param {Function} nutritionalInfo.getCaloriesFromFats - Method to calculate fat calories
   * @param {Function} nutritionalInfo.isHighProtein - Method to check if high protein (> 20g)
   *
   * @example
   * const nutritionalInfo = new NutritionalInfo({
   *   calories: 500,
   *   protein: 40,
   *   carbs: 50,
   *   fats: 15,
   *   fiber: 10,
   *   sugar: 12
   * });
   *
   * const response = new NutritionResponse(nutritionalInfo);
   * console.log(response.calories);            // 500
   * console.log(response.totalMacros);         // 105 (40 + 50 + 15)
   * console.log(response.caloriesFromProtein); // 160 (40 * 4)
   * console.log(response.isHighProtein);       // true (40 > 20)
   *
   * @example
   * // Low-protein recipe
   * const lowProteinInfo = new NutritionalInfo({
   *   calories: 300,
   *   protein: 10,
   *   carbs: 60,
   *   fats: 5,
   *   fiber: 8,
   *   sugar: 15
   * });
   *
   * const response = new NutritionResponse(lowProteinInfo);
   * console.log(response.isHighProtein);       // false (10 <= 20)
   * console.log(response.caloriesFromCarbs);   // 240 (60 * 4)
   */
  constructor(nutritionalInfo) {
    // Extract raw nutritional values from the value object

    /** Total calories in kilocalories (kcal) */
    this.calories = nutritionalInfo.calories;

    /** Protein content in grams */
    this.protein = nutritionalInfo.protein;

    /** Carbohydrate content in grams */
    this.carbs = nutritionalInfo.carbs;

    /** Fat content in grams */
    this.fats = nutritionalInfo.fats;

    /** Dietary fiber content in grams */
    this.fiber = nutritionalInfo.fiber;

    /** Sugar content in grams */
    this.sugar = nutritionalInfo.sugar;

    // Pre-calculate derived metrics using the value object's domain methods
    // These calculations are performed server-side to reduce client complexity

    /**
     * Total macronutrients (protein + carbs + fats) in grams
     *
     * Pre-calculated to avoid client-side arithmetic.
     * Useful for meal planning and dietary tracking.
     *
     * @example
     * // If protein=35g, carbs=45g, fats=12g
     * totalMacros = 92g
     */
    this.totalMacros = nutritionalInfo.getTotalMacros();

    /**
     * Calories derived from protein (protein grams × 4 kcal/g)
     *
     * Pre-calculated using the standard conversion factor of 4 kcal per gram.
     * Helps clients understand macronutrient contribution to total calories.
     *
     * @example
     * // If protein=35g
     * caloriesFromProtein = 140 kcal
     */
    this.caloriesFromProtein = nutritionalInfo.getCaloriesFromProtein();

    /**
     * Calories derived from carbohydrates (carb grams × 4 kcal/g)
     *
     * Pre-calculated using the standard conversion factor of 4 kcal per gram.
     * Useful for analyzing macronutrient balance.
     *
     * @example
     * // If carbs=45g
     * caloriesFromCarbs = 180 kcal
     */
    this.caloriesFromCarbs = nutritionalInfo.getCaloriesFromCarbs();

    /**
     * Calories derived from fats (fat grams × 9 kcal/g)
     *
     * Pre-calculated using the standard conversion factor of 9 kcal per gram.
     * Fats are more calorie-dense than protein or carbs.
     *
     * @example
     * // If fats=12g
     * caloriesFromFats = 108 kcal
     */
    this.caloriesFromFats = nutritionalInfo.getCaloriesFromFats();

    /**
     * Boolean flag indicating if this is a high-protein food (> 20g protein)
     *
     * Pre-calculated convenience flag for dietary filtering and UI display.
     * Helps clients quickly identify high-protein recipes without calculation.
     *
     * Threshold: 20 grams of protein per serving
     *
     * @example
     * // If protein=35g
     * isHighProtein = true
     *
     * @example
     * // If protein=15g
     * isHighProtein = false
     */
    this.isHighProtein = nutritionalInfo.isHighProtein();
  }
}

export default NutritionResponse;

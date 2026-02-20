/**
 * USDANutritionService
 *
 * Infrastructure service that integrates with the USDA FoodData Central API
 * to calculate nutritional information for recipe ingredients. This service
 * implements the external API integration layer, isolating the domain from
 * third-party dependencies.
 *
 * Features:
 * - Searches USDA FoodData Central for ingredient nutritional data
 * - Aggregates nutrition across multiple ingredients
 * - Converts various units of measurement to grams for standardization
 * - Provides comprehensive error handling and fallback behavior
 * - Returns zero values for ingredients not found (graceful degradation)
 *
 * API Details:
 * - Base URL: https://api.nal.usda.gov/fdc/v1
 * - Requires API key from USDA FoodData Central
 * - Uses food search endpoint to find ingredient matches
 * - Extracts standard nutrient IDs (calories, protein, carbs, fats, fiber, sugar)
 *
 * @class USDANutritionService
 * @module menu-management/infrastructure/services/USDANutritionService
 *
 * @example
 * const nutritionService = new USDANutritionService();
 * const ingredients = [
 *   { name: 'chicken breast', quantity: 200, unit: 'g' },
 *   { name: 'rice', quantity: 150, unit: 'g' }
 * ];
 * const nutrition = await nutritionService.calculate(ingredients);
 * console.log(nutrition.calories); // Total calories
 *
 * @see {@link https://fdc.nal.usda.gov/api-guide.html|USDA FoodData Central API Guide}
 */
import axios from 'axios';

class USDANutritionService {
  /**
   * Initializes the USDA nutrition service with API configuration
   *
   * Sets up the base URL and API key for communicating with the USDA
   * FoodData Central API. Warns if the API key is not configured but
   * does not fail initialization (allows for development/testing scenarios).
   *
   * @constructor
   *
   * @example
   * const service = new USDANutritionService();
   *
   * @security API key should be stored in environment variables in production,
   *           not hardcoded in the source code
   * @todo Move API key to environment variable (process.env.USDA_API_KEY)
   */
  constructor() {
    /**
     * Base URL for the USDA FoodData Central API
     * @type {string}
     * @private
     */
    this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';

    /**
     * API key for authenticating with USDA FoodData Central
     * @type {string}
     * @private
     * @security This should be loaded from environment variables, not hardcoded
     */
    this.apiKey = '7ZLpRVBLUkbqTVTWOzOWNJhtLsN8dwOF8uf6ZyG5';

    // Warn if API key is not configured (allows graceful degradation)
    if (!this.apiKey) {
      console.warn('USDA API key not configured in environment variables');
    }
  }

  /**
   * Calculates total nutritional information for a list of ingredients
   *
   * Iterates through each ingredient, fetches its nutritional data from USDA API,
   * and aggregates the totals. Returns rounded values for all nutrients.
   *
   * Workflow:
   * 1. Validate API key is configured
   * 2. Validate at least one ingredient is provided
   * 3. Initialize accumulator for total nutrition
   * 4. For each ingredient, fetch nutrition and add to totals
   * 5. Round all final values and return
   *
   * @async
   * @param {Array<Object>} ingredients - List of ingredient objects to calculate nutrition for
   * @param {string} ingredients[].name - Name of the ingredient (e.g., 'chicken breast')
   * @param {number} ingredients[].quantity - Amount of the ingredient
   * @param {string} ingredients[].unit - Unit of measurement (g, kg, cup, tbsp, etc.)
   * @returns {Promise<Object>} Aggregated nutritional information
   * @returns {number} returns.calories - Total calories in kcal (rounded)
   * @returns {number} returns.protein - Total protein in grams (rounded)
   * @returns {number} returns.carbs - Total carbohydrates in grams (rounded)
   * @returns {number} returns.fats - Total fats in grams (rounded)
   * @returns {number} returns.fiber - Total dietary fiber in grams (rounded)
   * @returns {number} returns.sugar - Total sugar in grams (rounded)
   * @throws {Error} If API key is not configured
   * @throws {Error} If ingredients array is empty or null
   * @throws {Error} If USDA API request fails
   * @throws {Error} If network connection fails
   *
   * @example
   * const nutrition = await service.calculate([
   *   { name: 'brown rice', quantity: 200, unit: 'g' },
   *   { name: 'chicken breast', quantity: 150, unit: 'g' }
   * ]);
   * console.log(nutrition.calories); // e.g., 380
   * console.log(nutrition.protein);  // e.g., 45
   */
  async calculate(ingredients) {
    // Validate that the API key is configured before attempting requests
    if (!this.apiKey) {
      throw new Error(
        'USDA_API_KEY is not configured in environment variables'
      );
    }

    // Validate that at least one ingredient is provided
    if (!ingredients || ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    try {
      // Initialize accumulator object to sum up nutrition from all ingredients
      const totalNutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        sugar: 0,
      };

      // Iterate through each ingredient and fetch its nutritional data
      for (const ingredient of ingredients) {
        // Fetch nutrition for this specific ingredient with its quantity and unit
        const nutrition = await this.getIngredientNutrition(
          ingredient.name,
          ingredient.quantity,
          ingredient.unit
        );

        // Add this ingredient's nutrition to the running totals
        totalNutrition.calories += nutrition.calories;
        totalNutrition.protein += nutrition.protein;
        totalNutrition.carbs += nutrition.carbs;
        totalNutrition.fats += nutrition.fats;
        totalNutrition.fiber += nutrition.fiber;
        totalNutrition.sugar += nutrition.sugar;
      }

      // Round all values to whole numbers for cleaner display
      return {
        calories: Math.round(totalNutrition.calories),
        protein: Math.round(totalNutrition.protein),
        carbs: Math.round(totalNutrition.carbs),
        fats: Math.round(totalNutrition.fats),
        fiber: Math.round(totalNutrition.fiber),
        sugar: Math.round(totalNutrition.sugar),
      };
    } catch (error) {
      // Handle different types of errors from the API request
      if (error.response) {
        // Server responded with an error status code
        console.error('USDA API error: ', error.response.data);
        throw new Error(
          `Nutrition API error: ${error.response.data.message || 'Unknown error'}`
        );
      } else if (error.request) {
        // Request was made but no response received (network issue)
        throw new Error(
          'Failed to reach USDA Nutrition API - check internet connection'
        );
      } else {
        // Error in setting up the request or other issues
        throw new Error(`Nutrition calculation failed: ${error.message}`);
      }
    }
  }

  /**
   * Fetches nutritional information for a single ingredient from USDA API
   *
   * Searches the USDA FoodData Central database for the ingredient, extracts
   * its nutritional data per 100g, then scales it based on the actual quantity used.
   *
   * If the ingredient is not found in the USDA database, returns zero values
   * for all nutrients (graceful degradation) and logs a warning.
   *
   * Workflow:
   * 1. Search USDA API for the ingredient by name
   * 2. If not found, return zeros (graceful degradation)
   * 3. Extract nutrients per 100g from the first match
   * 4. Convert the ingredient's quantity to grams
   * 5. Calculate the conversion factor (actual grams / 100)
   * 6. Scale all nutrient values by the conversion factor
   *
   * @async
   * @private
   * @param {string} name - Name of the ingredient to search for
   * @param {number} quantity - Amount of the ingredient
   * @param {string} unit - Unit of measurement (g, kg, cup, tbsp, etc.)
   * @returns {Promise<Object>} Nutritional information for the ingredient
   * @returns {number} returns.calories - Calories in kcal
   * @returns {number} returns.protein - Protein in grams
   * @returns {number} returns.carbs - Carbohydrates in grams
   * @returns {number} returns.fats - Fats in grams
   * @returns {number} returns.fiber - Dietary fiber in grams
   * @returns {number} returns.sugar - Sugar in grams
   * @throws {Error} If the USDA API request fails
   *
   * @example
   * const nutrition = await service.getIngredientNutrition('chicken breast', 200, 'g');
   * console.log(nutrition.protein); // e.g., 31
   */
  async getIngredientNutrition(name, quantity, unit) {
    try {
      // Construct the USDA API search endpoint URL
      const searchUrl = `${this.baseUrl}/foods/search`;

      // Execute search query for the ingredient
      const searchResponse = await axios.get(searchUrl, {
        params: {
          api_key: this.apiKey,
          query: name,
          pageSize: 1, // Only need the top match
        },
      });

      // Check if any foods were found in the search results
      if (
        !searchResponse.data.foods ||
        searchResponse.data.foods.length === 0
      ) {
        // Graceful degradation: log warning but return zeros instead of failing
        console.warn(`Ingredient not found in USDA database: ${name}`);

        return {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          fiber: 0,
          sugar: 0,
        };
      }

      // Use the first (best) match from the search results
      const food = searchResponse.data.foods[0];

      // Extract nutrient values per 100g from the food data
      const nutrientsPer100g = this.extractNutrients(food);

      // Convert the ingredient's quantity to grams for standardization
      const gramsUsed = this.convertToGrams(quantity, unit);

      // Calculate the scaling factor (actual amount / 100g base)
      const conversionFactor = gramsUsed / 100;

      // Scale all nutrient values by the conversion factor
      return {
        calories: nutrientsPer100g.calories * conversionFactor,
        protein: nutrientsPer100g.protein * conversionFactor,
        carbs: nutrientsPer100g.carbs * conversionFactor,
        fats: nutrientsPer100g.fats * conversionFactor,
        fiber: nutrientsPer100g.fiber * conversionFactor,
        sugar: nutrientsPer100g.sugar * conversionFactor,
      };
    } catch (error) {
      // Log the error with context and re-throw for upstream handling
      console.error(`Error getting nutrition for ${name}: `, error.message);
      throw error;
    }
  }

  /**
   * Extracts standard nutrient values from USDA food data
   *
   * Parses the USDA API's nutrient array and maps specific nutrient IDs
   * to our standardized nutrition object structure. Uses USDA's official
   * nutrient ID system to identify each nutrient type.
   *
   * Nutrient ID Mapping:
   * - 1008: Energy (Calories) in kcal
   * - 1003: Protein in grams
   * - 1005: Carbohydrates in grams
   * - 1004: Total lipid (fat) in grams
   * - 1079: Fiber, total dietary in grams
   * - 2000: Total sugars in grams
   *
   * @private
   * @param {Object} food - Food object returned from USDA API
   * @param {Array<Object>} food.foodNutrients - Array of nutrient objects
   * @returns {Object} Standardized nutrient values per 100g
   * @returns {number} returns.calories - Calories in kcal
   * @returns {number} returns.protein - Protein in grams
   * @returns {number} returns.carbs - Carbohydrates in grams
   * @returns {number} returns.fats - Fats in grams
   * @returns {number} returns.fiber - Dietary fiber in grams
   * @returns {number} returns.sugar - Sugar in grams
   *
   * @example
   * const food = { foodNutrients: [...] };
   * const nutrients = service.extractNutrients(food);
   * console.log(nutrients.protein); // e.g., 23.5
   *
   * @see {@link https://fdc.nal.usda.gov/api-spec/fdc_api.html#/|USDA Nutrient IDs}
   */
  extractNutrients(food) {
    // Initialize default nutrient object with zeros
    const nutrients = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sugar: 0,
    };

    // Return zeros if no nutrient data is available
    if (!food.foodNutrients) {
      return nutrients;
    }

    // Iterate through all nutrients and extract the ones we need by ID
    food.foodNutrients.forEach((nutrient) => {
      switch (nutrient.nutrientId) {
        case 1008: // Energy (Calories)
          nutrients.calories = nutrient.value || 0;
          break;
        case 1003: // Protein
          nutrients.protein = nutrient.value || 0;
          break;
        case 1005: // Carbohydrates
          nutrients.carbs = nutrient.value || 0;
          break;
        case 1004: // Total lipid (fat)
          nutrients.fats = nutrient.value || 0;
          break;
        case 1079: // Fiber, total dietary
          nutrients.fiber = nutrient.value || 0;
          break;
        case 2000: // Total sugars
          nutrients.sugar = nutrient.value || 0;
          break;
      }
    });

    return nutrients;
  }

  /**
   * Converts various units of measurement to grams
   *
   * Standardizes ingredient quantities by converting them all to grams,
   * which is the standard unit used in nutritional databases. Supports
   * common culinary units including metric, imperial, and volume measurements.
   *
   * Conversion factors are based on standard culinary measurements:
   * - Weight units: Direct conversion to grams
   * - Volume units: Assumes water density (1ml = 1g) as approximation
   * - Piece/unit: Uses 100g as default weight for countable items
   *
   * @private
   * @param {number} quantity - The numeric quantity to convert
   * @param {string} unit - The unit to convert from
   * @returns {number} The equivalent amount in grams
   *
   * @example
   * console.log(service.convertToGrams(2, 'cup'));   // 480 (2 * 240)
   * console.log(service.convertToGrams(1, 'kg'));    // 1000
   * console.log(service.convertToGrams(3, 'piece')); // 300 (3 * 100)
   *
   * @note Volume conversions (cup, ml, l, tbsp, tsp) assume water density.
   *       For non-liquid ingredients, results may be approximations.
   */
  convertToGrams(quantity, unit) {
    // Conversion factors: unit -> grams
    const conversions = {
      g: 1, // Grams (base unit)
      kg: 1000, // Kilograms
      mg: 0.001, // Milligrams
      oz: 28.35, // Ounces
      lb: 453.592, // Pounds
      cup: 240, // Cups (US standard, assumes water density)
      ml: 1, // Milliliters (assumes water density)
      l: 1000, // Liters (assumes water density)
      tbsp: 15, // Tablespoons (assumes water density)
      tsp: 5, // Teaspoons (assumes water density)
      piece: 100, // Individual pieces (100g default per piece)
    };

    // Get the conversion factor, defaulting to 1 if unit not found
    const factor = conversions[unit.toLowerCase()] || 1;

    // Apply the conversion: quantity * conversion factor = grams
    return quantity * factor;
  }
}

export default USDANutritionService;

/**
 * RecipeResponse
 *
 * Data Transfer Object (DTO) that represents the outgoing response payload
 * for recipe data sent to clients. This class implements the DTO pattern,
 * providing a clear boundary between the domain layer and the HTTP response format.
 *
 * Responsibilities:
 * 1. Transform Recipe domain entities into client-friendly JSON format
 * 2. Flatten or extract nested value objects (DietaryFlags, NutritionalInfo)
 * 3. Control exactly what data is exposed to clients (data hiding)
 * 4. Provide consistent response structure across all API endpoints
 * 5. Convert domain objects to plain JavaScript objects for JSON serialization
 *
 * Design Benefits:
 * - Decouples API response format from domain entity structure
 * - Prevents accidental exposure of internal domain methods or properties
 * - Allows API contract to evolve independently of domain model
 * - Extracts data from immutable value objects into plain objects
 * - Makes it easy to add/remove fields for different API versions
 * - Simplifies testing with predictable output structure
 *
 * Value Object Handling:
 * - DietaryFlags and NutritionalInfo value objects are unwrapped into plain objects
 * - This removes domain methods while preserving the data
 * - Null checks ensure graceful handling when optional data is missing
 *
 * @class RecipeResponse
 * @module menu-management/application/dtos/responses/RecipeResponse
 *
 * @example
 * // Using in a controller
 * app.get('/api/recipes/:id', async (req, res) => {
 *   const recipe = await getRecipeUseCase.execute(req.params.id);
 *   const response = new RecipeResponse(recipe);
 *   res.json(response);  // Automatically calls toJSON()
 * });
 *
 * @example
 * // Response structure
 * {
 *   "id": "64f1a2b3c4d5e6f7a8b9c0d1",
 *   "name": "Chicken Stir Fry",
 *   "description": "Quick and healthy stir fry",
 *   "ingredients": [...],
 *   "instructions": "Cut chicken, stir fry...",
 *   "servingSize": 2,
 *   "prepTime": 20,
 *   "seasonal": ["summer"],
 *   "allergens": ["soy"],
 *   "dietaryFlags": {
 *     "vegetarian": false,
 *     "vegan": false,
 *     "halal": true,
 *     "glutenFree": false,
 *     "dairyFree": true,
 *     "nutFree": true
 *   },
 *   "nutritionalInfo": {
 *     "calories": 450,
 *     "protein": 35,
 *     "carbs": 45,
 *     "fats": 12,
 *     "fiber": 5,
 *     "sugar": 8
 *   },
 *   "createdAt": "2024-01-15T10:30:00.000Z",
 *   "updatedAt": "2024-01-20T14:45:00.000Z"
 * }
 */
class RecipeResponse {
  /**
   * Constructs a RecipeResponse DTO from a Recipe domain entity
   *
   * Extracts all relevant fields from the domain entity and flattens
   * nested value objects (DietaryFlags, NutritionalInfo) into plain
   * JavaScript objects suitable for JSON serialization.
   *
   * Value objects are unwrapped to remove domain-specific methods while
   * preserving their data. Null checks ensure graceful handling when
   * optional value objects are not present.
   *
   * @constructor
   * @param {Recipe} recipe - Recipe domain entity to transform
   * @param {string} recipe.id - Unique identifier
   * @param {string} recipe.name - Recipe name
   * @param {string} recipe.description - Recipe description
   * @param {Array<Object>} recipe.ingredients - List of ingredients
   * @param {string} recipe.instructions - Cooking instructions
   * @param {number} recipe.servingSize - Number of servings
   * @param {number} recipe.prepTime - Preparation time in minutes
   * @param {Array<string>} recipe.seasonal - Seasonal availability tags
   * @param {Array<string>} recipe.allergens - List of allergens
   * @param {DietaryFlags|null} recipe.dietaryFlags - Dietary classification value object
   * @param {NutritionalInfo|null} recipe.nutritionalInfo - Nutritional data value object
   * @param {Date} recipe.createdAt - Creation timestamp
   * @param {Date} recipe.updatedAt - Last update timestamp
   *
   * @example
   * const recipe = await recipeRepository.findById('recipe-123');
   * const response = new RecipeResponse(recipe);
   * console.log(response.id);                // 'recipe-123'
   * console.log(response.dietaryFlags);      // Plain object, not DietaryFlags instance
   * console.log(response.nutritionalInfo);   // Plain object, not NutritionalInfo instance
   *
   * @example
   * // Handling missing optional value objects
   * const recipeWithoutNutrition = new Recipe({
   *   name: 'Test Recipe',
   *   nutritionalInfo: null  // Not calculated yet
   * });
   * const response = new RecipeResponse(recipeWithoutNutrition);
   * console.log(response.nutritionalInfo); // null (gracefully handled)
   */
  constructor(recipe) {
    // Extract core recipe fields directly from the domain entity

    /** Unique identifier for the recipe */
    this.id = recipe.id;

    /** Display name of the recipe */
    this.name = recipe.name;

    /** Brief description or tagline */
    this.description = recipe.description;

    /** List of ingredients with quantities and units */
    this.ingredients = recipe.ingredients;

    /** Step-by-step cooking instructions */
    this.instructions = recipe.instructions;

    /** Number of servings the recipe yields */
    this.servingSize = recipe.servingSize;

    /** Preparation time in minutes */
    this.prepTime = recipe.prepTime;

    /** Seasonal availability tags */
    this.seasonal = recipe.seasonal;

    /** List of allergens present in the recipe */
    this.allergens = recipe.allergens;

    /**
     * Dietary classification flags
     *
     * Unwraps the DietaryFlags value object into a plain JavaScript object.
     * This removes domain-specific methods (like isCompliantWith) while
     * preserving the boolean flag data for JSON serialization.
     *
     * Returns null if dietaryFlags value object is not present.
     */
    this.dietaryFlags = recipe.dietaryFlags
      ? {
          vegetarian: recipe.dietaryFlags.vegetarian,
          vegan: recipe.dietaryFlags.vegan,
          halal: recipe.dietaryFlags.halal,
          glutenFree: recipe.dietaryFlags.glutenFree,
          dairyFree: recipe.dietaryFlags.dairyFree,
          nutFree: recipe.dietaryFlags.nutFree,
        }
      : null;

    /**
     * Nutritional information per serving
     *
     * Unwraps the NutritionalInfo value object into a plain JavaScript object.
     * This removes domain-specific methods (like getCaloriesFromProtein,
     * isHighProtein) while preserving the numerical data for JSON serialization.
     *
     * Returns null if nutritionalInfo value object is not present
     * (e.g., nutrition not yet calculated or calculation failed).
     */
    this.nutritionalInfo = recipe.nutritionalInfo
      ? {
          calories: recipe.nutritionalInfo.calories,
          protein: recipe.nutritionalInfo.protein,
          carbs: recipe.nutritionalInfo.carbs,
          fats: recipe.nutritionalInfo.fats,
          fiber: recipe.nutritionalInfo.fiber,
          sugar: recipe.nutritionalInfo.sugar,
        }
      : null;

    /** Timestamp when the recipe was created */
    this.createdAt = recipe.createdAt;

    /** Timestamp when the recipe was last updated */
    this.updatedAt = recipe.updatedAt;
  }

  /**
   * Serializes the response to a plain JSON object
   *
   * Provides explicit control over JSON serialization, ensuring a consistent
   * output structure. This method is automatically called by JSON.stringify()
   * when the response is sent over HTTP.
   *
   * Benefits:
   * - Guarantees field order in the JSON output
   * - Provides a single source of truth for response structure
   * - Makes it easy to add custom transformations (e.g., date formatting)
   * - Simplifies testing by providing a predictable structure
   *
   * @returns {Object} Plain JavaScript object ready for JSON serialization
   *
   * @example
   * // Automatic invocation during JSON serialization
   * const response = new RecipeResponse(recipe);
   * res.json(response);  // Express automatically calls JSON.stringify()
   *                      // which in turn calls response.toJSON()
   *
   * @example
   * // Manual invocation
   * const response = new RecipeResponse(recipe);
   * const json = response.toJSON();
   * console.log(json);  // Plain object
   *
   * @example
   * // Using with JSON.stringify
   * const response = new RecipeResponse(recipe);
   * const jsonString = JSON.stringify(response, null, 2);
   * console.log(jsonString);  // Pretty-printed JSON string
   */
  toJSON() {
    // Return a plain JavaScript object containing all response fields
    // This structure defines the exact JSON format clients will receive
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      ingredients: this.ingredients,
      instructions: this.instructions,
      servingSize: this.servingSize,
      prepTime: this.prepTime,
      seasonal: this.seasonal,
      allergens: this.allergens,
      dietaryFlags: this.dietaryFlags,
      nutritionalInfo: this.nutritionalInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default RecipeResponse;

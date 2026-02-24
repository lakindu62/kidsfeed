/**
 * CreateRecipeRequest
 *
 * Data Transfer Object (DTO) that represents and validates the incoming request
 * payload for creating a new recipe. This class implements the DTO pattern,
 * providing a clear boundary between the HTTP layer and the application layer.
 *
 * Responsibilities:
 * 1. Map raw HTTP request body to a structured object with type safety
 * 2. Apply default values for optional fields
 * 3. Validate all required fields and business constraints
 * 4. Collect and return all validation errors (not just the first one)
 * 5. Provide a clean, validated data structure to pass to use cases
 *
 * Design Benefits:
 * - Decouples HTTP request format from domain entities
 * - Centralizes validation logic in one place
 * - Provides comprehensive error reporting (all errors at once)
 * - Makes it easy to change API contracts without affecting domain
 * - Simplifies testing with clear input/output contracts
 *
 * Validation Strategy:
 * - Accumulates all validation errors rather than failing on first error
 * - Provides specific, actionable error messages
 * - Validates both presence and correctness of data
 * - Uses index-based error messages for array validation
 *
 * @class CreateRecipeRequest
 * @module menu-management/application/dtos/requests/CreateRecipeRequest
 *
 * @example
 * // Using in an Express route handler
 * app.post('/api/recipes', async (req, res) => {
 *   const createRequest = new CreateRecipeRequest(req.body);
 *   const errors = createRequest.validate();
 *
 *   if (errors.length > 0) {
 *     return res.status(400).json({ errors });
 *   }
 *
 *   const recipe = await createRecipeUseCase.execute(createRequest);
 *   res.status(201).json(recipe);
 * });
 */
class CreateRecipeRequest {
  /**
   * Constructs a CreateRecipeRequest DTO from an HTTP request body
   *
   * Maps the raw request body to a structured object with defaults applied.
   * Required fields are assigned directly, while optional fields receive
   * sensible defaults to simplify downstream processing.
   *
   * @constructor
   * @param {Object} body - Raw HTTP request body (typically from req.body)
   * @param {string} body.name - Recipe name (required)
   * @param {Array<Object>} body.ingredients - List of ingredients (required)
   * @param {string} body.ingredients[].name - Ingredient name
   * @param {number} body.ingredients[].quantity - Ingredient quantity
   * @param {string} body.ingredients[].unit - Measurement unit
   * @param {string} body.instructions - Cooking instructions (required)
   * @param {number} body.servingSize - Number of servings (required)
   * @param {string} [body.description=''] - Recipe description (optional)
   * @param {Object} [body.dietaryFlags] - Dietary classifications (optional)
   * @param {boolean} [body.dietaryFlags.vegetarian=false] - Vegetarian flag
   * @param {boolean} [body.dietaryFlags.vegan=false] - Vegan flag
   * @param {boolean} [body.dietaryFlags.halal=false] - Halal flag
   * @param {boolean} [body.dietaryFlags.glutenFree=false] - Gluten-free flag
   * @param {boolean} [body.dietaryFlags.dairyFree=false] - Dairy-free flag
   * @param {boolean} [body.dietaryFlags.nutFree=false] - Nut-free flag
   * @param {Array<string>} [body.allergens=[]] - List of allergens (optional)
   * @param {number} [body.prepTime=30] - Preparation time in minutes (optional)
   * @param {Array<string>} [body.seasonal=[]] - Seasonal tags (optional)
   * @param {string} body.createdBy - User ID of recipe creator (required)
   *
   * @example
   * const requestBody = {
   *   name: 'Chicken Stir Fry',
   *   ingredients: [
   *     { name: 'chicken breast', quantity: 300, unit: 'g' },
   *     { name: 'soy sauce', quantity: 2, unit: 'tbsp' }
   *   ],
   *   instructions: 'Cut chicken, stir fry with sauce...',
   *   servingSize: 2,
   *   description: 'Quick and easy stir fry',
   *   prepTime: 20,
   *   dietaryFlags: { glutenFree: false },
   *   allergens: ['soy'],
   *   createdBy: 'user-123'
   * };
   *
   * const request = new CreateRecipeRequest(requestBody);
   */
  constructor(body) {
    // Required fields - assigned directly from request body

    /** Recipe name */
    this.name = body.name;

    /** List of ingredients with quantities and units */
    this.ingredients = body.ingredients;

    /** Step-by-step cooking instructions */
    this.instructions = body.instructions;

    /** Number of servings the recipe yields */
    this.servingSize = body.servingSize;

    /** User ID of the person creating the recipe */
    this.createdBy = body.createdBy;

    // Optional fields - with default values

    /** Brief description of the recipe (defaults to empty string) */
    this.description = body.description || '';

    /**
     * Dietary classification flags
     * Defaults to all false if not provided or partially provided
     */
    this.dietaryFlags = body.dietaryFlags || {
      vegetarian: false,
      vegan: false,
      halal: false,
      glutenFree: false,
      dairyFree: false,
      nutFree: false,
    };

    /** List of allergens present in the recipe (defaults to empty array) */
    this.allergens = body.allergens || [];

    /** Preparation time in minutes (defaults to 30 minutes) */
    this.prepTime = body.prepTime || 30;

    /** Seasonal availability tags (defaults to empty array) */
    this.seasonal = body.seasonal || [];
  }

  /**
   * Validates the request data according to business rules
   *
   * Performs comprehensive validation of all required fields and business
   * constraints. Accumulates all validation errors rather than failing fast,
   * allowing the client to fix multiple issues at once for better UX.
   *
   * Validation Rules:
   * - Recipe name must be present and non-empty after trimming
   * - At least one ingredient must be provided
   * - Each ingredient must have: name, positive quantity, and unit
   * - Instructions must be present and non-empty after trimming
   * - Serving size must be greater than 0
   *
   * @returns {Array<string>} Array of validation error messages (empty if valid)
   *
   * @example
   * // Valid request - returns empty array
   * const validRequest = new CreateRecipeRequest({
   *   name: 'Pasta',
   *   ingredients: [{ name: 'pasta', quantity: 200, unit: 'g' }],
   *   instructions: 'Boil water, cook pasta',
   *   servingSize: 2,
   *   createdBy: 'user-123'
   * });
   * console.log(validRequest.validate()); // []
   *
   * @example
   * // Invalid request - returns multiple errors
   * const invalidRequest = new CreateRecipeRequest({
   *   name: '',  // Empty name
   *   ingredients: [
   *     { name: 'pasta', quantity: -10, unit: 'g' },  // Negative quantity
   *     { quantity: 5, unit: 'g' }  // Missing name
   *   ],
   *   instructions: '',  // Empty instructions
   *   servingSize: 0,    // Invalid serving size
   *   createdBy: 'user-123'
   * });
   *
   * const errors = invalidRequest.validate();
   * console.log(errors);
   * // [
   * //   'Recipe name is required',
   * //   'Ingredient 1: valid quantity is required',
   * //   'Ingredient 2: name is required',
   * //   'Instructions are required',
   * //   'Serving size must be greater than 0'
   * // ]
   *
   * @example
   * // Using in a controller with proper error handling
   * const createRequest = new CreateRecipeRequest(req.body);
   * const validationErrors = createRequest.validate();
   *
   * if (validationErrors.length > 0) {
   *   return res.status(400).json({
   *     error: 'Validation failed',
   *     details: validationErrors
   *   });
   * }
   *
   * // Validation passed - proceed with use case
   * const recipe = await createRecipeUseCase.execute(createRequest);
   */
  validate() {
    // Initialize array to collect all validation errors
    const errors = [];

    // Validate recipe name is present and not empty/whitespace-only
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Recipe name is required');
    }

    // Validate ingredients array exists and has at least one ingredient
    if (!this.ingredients || this.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    } else {
      // Validate each individual ingredient's structure and values
      this.ingredients.forEach((ing, index) => {
        // Check that ingredient has a name
        if (!ing.name) {
          errors.push(`Ingredient ${index + 1}: name is required`);
        }

        // Check that ingredient has a valid quantity (present and positive)
        if (!ing.quantity || ing.quantity <= 0) {
          errors.push(`Ingredient ${index + 1}: valid quantity is required`);
        }

        // Check that ingredient has a unit of measurement
        if (!ing.unit) {
          errors.push(`Ingredient ${index + 1}: unit is required`);
        }
      });
    }

    // Validate instructions are present and not empty/whitespace-only
    if (!this.instructions || this.instructions.trim().length === 0) {
      errors.push('Instructions are required');
    }

    // Validate serving size is present and greater than zero
    if (!this.servingSize || this.servingSize <= 0) {
      errors.push('Serving size must be greater than 0');
    }

    // Return all accumulated errors (empty array if validation passed)
    return errors;
  }
}

export default CreateRecipeRequest;

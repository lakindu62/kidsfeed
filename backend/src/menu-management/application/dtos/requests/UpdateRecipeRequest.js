/**
 * UpdateRecipeRequest
 *
 * Data Transfer Object (DTO) that represents and validates the incoming request
 * payload for updating an existing recipe. This class implements the DTO pattern
 * with support for partial updates, allowing clients to update only specific
 * fields without affecting others.
 *
 * Responsibilities:
 * 1. Map only the provided fields from the HTTP request body (partial updates)
 * 2. Ignore undefined fields to distinguish between "not provided" and "set to null"
 * 3. Validate all provided fields according to business constraints
 * 4. Collect and return all validation errors (not just the first one)
 * 5. Provide a clean, validated data structure to pass to use cases
 *
 * Partial Update Strategy:
 * - Only includes fields that are explicitly provided in the request
 * - Uses `!== undefined` checks to distinguish null from absence
 * - Allows clients to update one field, some fields, or all fields
 * - Preserves existing values for fields not included in the request
 *
 * Design Benefits:
 * - Supports RESTful PATCH semantics (partial updates)
 * - Reduces bandwidth by only sending changed fields
 * - Prevents accidental data loss from missing fields
 * - Makes API more flexible and client-friendly
 * - Simplifies testing with clear input/output contracts
 *
 * Validation Strategy:
 * - Only validates fields that are actually provided
 * - Accumulates all validation errors rather than failing on first error
 * - Provides specific, actionable error messages
 * - Uses index-based error messages for array validation
 *
 * @class UpdateRecipeRequest
 * @module menu-management/application/dtos/requests/UpdateRecipeRequest
 *
 * @example
 * // Partial update - only name and prep time
 * const updateRequest = new UpdateRecipeRequest({
 *   name: 'Quick Pasta',
 *   prepTime: 15
 *   // Other fields omitted - will remain unchanged
 * });
 * console.log(updateRequest.name);         // 'Quick Pasta'
 * console.log(updateRequest.prepTime);     // 15
 * console.log(updateRequest.ingredients);  // undefined (not provided)
 *
 * @example
 * // Using in an Express route handler
 * app.patch('/api/recipes/:id', async (req, res) => {
 *   const updateRequest = new UpdateRecipeRequest(req.body);
 *   const errors = updateRequest.validate();
 *
 *   if (errors.length > 0) {
 *     return res.status(400).json({ errors });
 *   }
 *
 *   const recipe = await updateRecipeUseCase.execute(req.params.id, updateRequest);
 *   res.status(200).json(recipe);
 * });
 */
class UpdateRecipeRequest {
  /**
   * Constructs an UpdateRecipeRequest DTO from an HTTP request body
   *
   * Maps only the fields that are explicitly provided in the request body.
   * Uses strict `!== undefined` checks to distinguish between fields that
   * are absent (undefined) and fields set to null or other falsy values.
   *
   * This approach enables true partial updates where clients can:
   * - Update specific fields without affecting others
   * - Set fields to null/empty if explicitly provided
   * - Omit fields entirely to leave them unchanged
   *
   * @constructor
   * @param {Object} body - Raw HTTP request body (typically from req.body)
   * @param {string} [body.name] - Updated recipe name
   * @param {string} [body.description] - Updated recipe description
   * @param {Array<Object>} [body.ingredients] - Updated list of ingredients
   * @param {string} [body.ingredients[].name] - Ingredient name
   * @param {number} [body.ingredients[].quantity] - Ingredient quantity
   * @param {string} [body.ingredients[].unit] - Measurement unit
   * @param {string} [body.instructions] - Updated cooking instructions
   * @param {Object} [body.dietaryFlags] - Updated dietary classifications
   * @param {boolean} [body.dietaryFlags.vegetarian] - Vegetarian flag
   * @param {boolean} [body.dietaryFlags.vegan] - Vegan flag
   * @param {boolean} [body.dietaryFlags.halal] - Halal flag
   * @param {boolean} [body.dietaryFlags.glutenFree] - Gluten-free flag
   * @param {boolean} [body.dietaryFlags.dairyFree] - Dairy-free flag
   * @param {boolean} [body.dietaryFlags.nutFree] - Nut-free flag
   * @param {Array<string>} [body.allergens] - Updated list of allergens
   * @param {number} [body.servingSize] - Updated number of servings
   * @param {number} [body.prepTime] - Updated preparation time in minutes
   * @param {Array<string>} [body.seasonal] - Updated seasonal tags
   *
   * @example
   * // Update only the name
   * const request = new UpdateRecipeRequest({ name: 'New Recipe Name' });
   * console.log(request.name);         // 'New Recipe Name'
   * console.log(request.ingredients);  // undefined (not provided)
   *
   * @example
   * // Update multiple fields
   * const request = new UpdateRecipeRequest({
   *   name: 'Updated Name',
   *   prepTime: 25,
   *   allergens: ['nuts', 'dairy']
   * });
   * console.log(request.name);      // 'Updated Name'
   * console.log(request.prepTime);  // 25
   * console.log(request.allergens); // ['nuts', 'dairy']
   * console.log(request.seasonal);  // undefined (not provided)
   *
   * @example
   * // Explicitly set a field to null (clears the value)
   * const request = new UpdateRecipeRequest({
   *   description: null,  // Explicitly clear description
   *   allergens: []       // Explicitly clear allergens list
   * });
   * console.log(request.description); // null (will be saved as null)
   * console.log(request.allergens);   // [] (will be saved as empty array)
   */
  constructor(body) {
    // Only assign fields that are explicitly provided in the request body
    // Using strict `!== undefined` check to distinguish absence from null/falsy values

    /** Updated recipe name (optional for partial updates) */
    if (body.name !== undefined) {
      this.name = body.name;
    }

    /** Updated recipe description (optional for partial updates) */
    if (body.description !== undefined) {
      this.description = body.description;
    }

    /** Updated list of ingredients (optional for partial updates) */
    if (body.ingredients !== undefined) {
      this.ingredients = body.ingredients;
    }

    /** Updated cooking instructions (optional for partial updates) */
    if (body.instructions !== undefined) {
      this.instructions = body.instructions;
    }

    /** Updated dietary classification flags (optional for partial updates) */
    if (body.dietaryFlags !== undefined) {
      this.dietaryFlags = body.dietaryFlags;
    }

    /** Updated list of allergens (optional for partial updates) */
    if (body.allergens !== undefined) {
      this.allergens = body.allergens;
    }

    /** Updated number of servings (optional for partial updates) */
    if (body.servingSize !== undefined) {
      this.servingSize = body.servingSize;
    }

    /** Updated preparation time in minutes (optional for partial updates) */
    if (body.prepTime !== undefined) {
      this.prepTime = body.prepTime;
    }

    /** Updated seasonal availability tags (optional for partial updates) */
    if (body.seasonal !== undefined) {
      this.seasonal = body.seasonal;
    }
  }

  /**
   * Validates the provided update fields according to business rules
   *
   * Performs validation only on fields that are actually provided in the
   * update request. This allows partial updates while still enforcing
   * business constraints on any fields that are being changed.
   *
   * Key Difference from CreateRecipeRequest:
   * - Only validates fields that exist (undefined fields are skipped)
   * - Allows flexibility in what can be updated
   * - Still enforces constraints (e.g., non-empty name, positive quantity)
   *
   * Validation Rules (applied only to provided fields):
   * - Recipe name, if provided, must not be empty after trimming
   * - Ingredients array, if provided, must have at least one ingredient
   * - Each ingredient must have: name, positive quantity, and unit
   * - Instructions, if provided, must not be empty after trimming
   * - Serving size, if provided, must be greater than 0
   *
   * @returns {Array<string>} Array of validation error messages (empty if valid)
   *
   * @example
   * // Valid partial update - returns empty array
   * const validRequest = new UpdateRecipeRequest({
   *   prepTime: 25,
   *   seasonal: ['summer']
   * });
   * console.log(validRequest.validate()); // []
   *
   * @example
   * // Invalid update - empty name provided
   * const invalidRequest = new UpdateRecipeRequest({
   *   name: '   ',  // Empty after trimming
   *   prepTime: 20
   * });
   * const errors = invalidRequest.validate();
   * console.log(errors); // ['Recipe name cannot be empty']
   *
   * @example
   * // Invalid ingredients update - multiple errors
   * const invalidRequest = new UpdateRecipeRequest({
   *   ingredients: [
   *     { name: 'pasta', quantity: -10, unit: 'g' },  // Negative quantity
   *     { quantity: 5, unit: 'g' }  // Missing name
   *   ]
   * });
   * const errors = invalidRequest.validate();
   * console.log(errors);
   * // [
   * //   'Ingredient 1: valid quantity is required',
   * //   'Ingredient 2: name is required'
   * // ]
   *
   * @example
   * // Using in a controller with proper error handling
   * const updateRequest = new UpdateRecipeRequest(req.body);
   * const validationErrors = updateRequest.validate();
   *
   * if (validationErrors.length > 0) {
   *   return res.status(400).json({
   *     error: 'Validation failed',
   *     details: validationErrors
   *   });
   * }
   *
   * // Validation passed - proceed with use case
   * const recipe = await updateRecipeUseCase.execute(
   *   req.params.id,
   *   updateRequest
   * );
   * res.status(200).json(recipe);
   */
  validate() {
    // Initialize array to collect all validation errors
    const errors = [];

    // Validate name only if it was provided in the update request
    // If provided, it must not be empty or whitespace-only
    if (this.name !== undefined && this.name.trim().length === 0) {
      errors.push('Recipe name cannot be empty');
    }

    // Validate ingredients only if they were provided in the update request
    if (this.ingredients !== undefined) {
      // If ingredients are being updated, at least one must be provided
      if (this.ingredients.length === 0) {
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
    }

    // Validate instructions only if they were provided in the update request
    // If provided, they must not be empty or whitespace-only
    if (
      this.instructions !== undefined &&
      this.instructions.trim().length === 0
    ) {
      errors.push('Instructions cannot be empty');
    }

    // Validate serving size only if it was provided in the update request
    // If provided, it must be greater than zero
    if (this.servingSize !== undefined && this.servingSize <= 0) {
      errors.push('Serving size must be greater than 0');
    }

    // Return all accumulated errors (empty array if validation passed)
    return errors;
  }
}

export default UpdateRecipeRequest;

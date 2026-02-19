/**
 * UpdateRecipeUseCase
 *
 * Application service responsible for orchestrating the update of existing recipes.
 * This use case implements the Command pattern from Clean Architecture, encapsulating
 * the business logic for safely updating recipe data while preserving immutable fields
 * and maintaining data integrity.
 *
 * Responsibilities:
 * 1. Verify that the recipe to update exists (throw exception if not found)
 * 2. Merge update data with existing recipe data (partial update support)
 * 3. Construct a new Recipe domain entity with the merged data
 * 4. Validate the updated recipe according to business rules
 * 5. Optionally recalculate nutritional information if ingredients changed
 * 6. Persist the updated recipe using the repository
 *
 * Update Strategy:
 * - Supports partial updates using nullish coalescing (??) operator
 * - Preserves immutable fields (id, createdAt, isActive)
 * - Updates the updatedAt timestamp automatically
 * - Recalculates nutrition only when ingredients are modified
 *
 * This use case is independent of the delivery mechanism (REST API, GraphQL, CLI),
 * making it reusable across different interfaces and easy to test in isolation.
 *
 * @class UpdateRecipeUseCase
 * @module menu-management/application/use-cases/recipe/UpdateRecipeUseCase
 *
 * @example
 * const useCase = new UpdateRecipeUseCase(recipeRepository, nutritionService);
 * const updated = await useCase.execute('recipe-123', {
 *   name: 'Updated Recipe Name',
 *   prepTime: 45
 *   // Other fields remain unchanged
 * });
 */
import Recipe from '../../../domain/entities/Recipe';
import DietaryFlags from '../../../domain/value-objects/DietaryFlags';
import RecipeNotFoundException from '../../../domain/exceptions/RecipeNotFoundException';

class UpdateRecipeUseCase {
  /**
   * Initializes the use case with required dependencies
   *
   * @constructor
   * @param {IRecipeRepository} recipeRepository - Repository for persisting recipe updates
   * @param {Object|null} [nutrionService=null] - Optional service for recalculating nutritional info
   *
   * @example
   * // With nutrition service
   * const useCase = new UpdateRecipeUseCase(mongoRepo, nutritionAPI);
   *
   * // Without nutrition service (nutrition won't be recalculated)
   * const useCase = new UpdateRecipeUseCase(mongoRepo);
   *
   * @todo Fix typo: 'nutrionService' parameter should be 'nutritionService'
   */
  constructor(recipeRepository, nutrionService = null) {
    /**
     * Repository instance for persisting recipe updates
     * @type {IRecipeRepository}
     * @private
     */
    this.recipeRepository = recipeRepository;

    /**
     * Optional nutrition calculation service
     * When null, nutritional information will not be recalculated on updates
     * @type {Object|null}
     * @private
     * @todo Fix typo: 'nutrionService' property should be 'nutritionService'
     */
    this.nutrionService = nutrionService;
  }

  /**
   * Executes the recipe update workflow
   *
   * Orchestrates the following steps:
   * 1. Retrieves the existing recipe and validates it exists
   * 2. Merges update data with existing data (partial update support)
   * 3. Constructs a new Recipe entity with the merged data
   * 4. Validates the updated recipe according to domain business rules
   * 5. Optionally recalculates nutritional info if ingredients were modified
   * 6. Persists the updated recipe via the repository
   * 7. Returns the saved recipe with updated timestamp
   *
   * @async
   * @param {string} recipeId - The unique identifier of the recipe to update
   * @param {Object} updateData - Partial recipe data containing fields to update
   * @param {string} [updateData.name] - Updated recipe name
   * @param {string} [updateData.description] - Updated description
   * @param {Array<Object>} [updateData.ingredients] - Updated ingredients list
   * @param {string} [updateData.instructions] - Updated cooking instructions
   * @param {Object} [updateData.dietaryFlags] - Updated dietary flags
   * @param {Array<string>} [updateData.allergens] - Updated allergen list
   * @param {number} [updateData.servingSize] - Updated serving size
   * @param {number} [updateData.prepTime] - Updated preparation time
   * @param {Array<string>} [updateData.seasonal] - Updated seasonal tags
   * @returns {Promise<Recipe>} The updated Recipe entity with new timestamp
   * @throws {RecipeNotFoundException} If no recipe exists with the given ID
   * @throws {Error} If recipe validation fails (e.g., invalid field values)
   * @throws {Error} If repository update operation fails
   *
   * @example
   * // Partial update - only update name and prep time
   * const updated = await updateRecipeUseCase.execute('64f1a2b3c4d5e6f7a8b9c0d1', {
   *   name: 'Quick Pasta',
   *   prepTime: 15
   * });
   *
   * @example
   * // Update ingredients (triggers nutrition recalculation)
   * const updated = await updateRecipeUseCase.execute('64f1a2b3c4d5e6f7a8b9c0d1', {
   *   ingredients: [
   *     { name: 'spaghetti', quantity: 500, unit: 'g' },
   *     { name: 'tomato sauce', quantity: 400, unit: 'ml' }
   *   ]
   * });
   *
   * @example
   * // Recipe not found scenario
   * try {
   *   await updateRecipeUseCase.execute('invalid-id', { name: 'Test' });
   * } catch (error) {
   *   console.log(error.name);       // 'RecipeNotFoundException'
   *   console.log(error.statusCode); // 404
   * }
   */
  async execute(recipeId, updateData) {
    // Step 1: Retrieve the existing recipe from the repository
    const existingRecipe = await this.recipeRepository.findById(recipeId);

    // Step 2: Validate that the recipe exists
    // Throw a domain-specific exception if not found (404 status)
    if (!existingRecipe) {
      throw new RecipeNotFoundException(recipeId);
    }

    // Step 3: Construct a new Recipe entity by merging update data with existing data
    // Uses nullish coalescing (??) to prefer update values, falling back to existing values
    // This supports partial updates where only some fields are provided
    const updatedRecipe = new Recipe({
      // Preserve the original ID (immutable field)
      id: recipeId,

      // Merge updatable fields using nullish coalescing
      // If updateData field is null/undefined, use the existing value
      name: updateData.name ?? existingRecipe.name,
      description: updateData.description ?? existingRecipe.description,
      ingredients: updateData.ingredients ?? existingRecipe.ingredients,
      instructions: updateData.instructions ?? existingRecipe.instructions,

      // Handle dietary flags specially - reconstruct value object if provided
      dietaryFlags: updateData.dietaryFlags
        ? new DietaryFlags(updateData.dietaryFlags)
        : existingRecipe.dietaryFlags,

      allergens: updateData.allergens ?? existingRecipe.allergens,
      prepTime: updateData.prepTime ?? existingRecipe.prepTime,
      servingSize: updateData.servingSize ?? existingRecipe.servingSize,
      seasonal: updateData.seasonal ?? existingRecipe.seasonal,

      // Preserve existing nutrition (will be recalculated later if ingredients changed)
      nutritionalInfo: existingRecipe.nutritionalInfo,

      // Preserve immutable system fields
      isActive: existingRecipe.isActive,
      createdAt: existingRecipe.createdAt,

      // Set the updated timestamp to the current time
      updatedAt: new Date(),
    });

    // Step 4: Validate the updated recipe according to domain business rules
    // Throws an Error if validation fails (e.g., empty name, no ingredients)
    updatedRecipe.validate();

    // Step 5: Optionally recalculate nutritional information if ingredients were modified
    if (
      this.nutrionService &&
      updateData.ingredients &&
      updateData.ingredients.length > 0
    ) {
      try {
        // Call the external nutrition service to recalculate nutritional data
        // BUG: Typo - 'this.nutrionService' should be 'this.nutritionService'
        const nutritionData = await this.nutrionService.calculate(
          updatedRecipe.ingredients
        );

        // Update the recipe entity with the new nutritional information
        updatedRecipe.updateNutrition(nutritionData);
      } catch (error) {
        // Log the error but don't fail the entire update operation
        // Nutrition recalculation is considered a non-critical enhancement
        console.warn('Nutrition recalculation failed: ', error.message);
      }
    }

    // Step 6: Persist the updated recipe using the repository
    return await this.recipeRepository.updateData(recipeId, updatedRecipe);
  }
}

export default UpdateRecipeUseCase;

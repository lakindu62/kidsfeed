/**
 * DeleteRecipeUseCase
 *
 * Application service responsible for orchestrating the soft deletion of recipes.
 * This use case implements the Command pattern from Clean Architecture, encapsulating
 * the business logic for safely removing recipes from active use while preserving
 * historical data.
 *
 * Responsibilities:
 * 1. Execute the soft delete operation via the repository
 * 2. Verify that the recipe exists (throw exception if not found)
 * 3. Return the deactivated recipe entity for confirmation or logging
 *
 * Soft Delete Strategy:
 * This use case performs a "soft delete" rather than permanently removing the recipe
 * from the database. The recipe's 'isActive' flag is set to false, which:
 * - Excludes it from all active recipe queries
 * - Preserves historical data for reporting and auditing
 * - Allows for potential recovery or restoration if needed
 * - Maintains referential integrity with related entities (e.g., meal plans)
 *
 * This use case is independent of the delivery mechanism (REST API, GraphQL, CLI),
 * making it reusable across different interfaces and easy to test in isolation.
 *
 * @class DeleteRecipeUseCase
 * @module menu-management/application/use-cases/recipe/DeleteRecipeUseCase
 *
 * @example
 * const useCase = new DeleteRecipeUseCase(recipeRepository);
 * try {
 *   const deactivated = await useCase.execute('64f1a2b3c4d5e6f7a8b9c0d1');
 *   console.log(deactivated.isActive); // false
 *   console.log('Recipe soft-deleted successfully');
 * } catch (error) {
 *   if (error instanceof RecipeNotFoundException) {
 *     console.log('Recipe not found');
 *   }
 * }
 */
import RecipeNotFoundException from '../../../domain/exceptions/RecipeNotFoundException';

class DeleteRecipeUseCase {
  /**
   * Initializes the use case with required dependencies
   *
   * @constructor
   * @param {IRecipeRepository} recipeRepository - Repository for performing delete operations
   *
   * @example
   * const useCase = new DeleteRecipeUseCase(mongoRecipeRepository);
   */
  constructor(recipeRepository) {
    /**
     * Repository instance for performing delete operations
     * @type {IRecipeRepository}
     * @private
     */
    this.recipeRepository = recipeRepository;
  }

  /**
   * Executes the recipe soft delete workflow
   *
   * Performs a soft delete by marking the recipe as inactive (isActive: false)
   * rather than permanently removing it from the database. This preserves
   * historical data and maintains referential integrity with related entities.
   *
   * If the recipe doesn't exist or the ID is invalid, throws a
   * RecipeNotFoundException to maintain consistent error handling.
   *
   * @async
   * @param {string} recipeId - The unique identifier of the recipe to soft delete
   * @returns {Promise<Recipe>} The deactivated Recipe domain entity with isActive: false
   * @throws {RecipeNotFoundException} If no recipe exists with the given ID or ID is invalid
   * @throws {Error} If the repository delete operation fails (e.g., database connection error)
   *
   * @example
   * // Successful soft delete
   * const deactivated = await deleteRecipeUseCase.execute('64f1a2b3c4d5e6f7a8b9c0d1');
   * console.log(deactivated.isActive);  // false
   * console.log(deactivated.updatedAt); // Current timestamp
   *
   * @example
   * // Recipe not found scenario
   * try {
   *   await deleteRecipeUseCase.execute('invalid-id');
   * } catch (error) {
   *   console.log(error.name);       // 'RecipeNotFoundException'
   *   console.log(error.statusCode); // 404
   *   console.log(error.recipeId);   // 'invalid-id'
   * }
   *
   * @example
   * // Use in an API controller
   * async deleteRecipe(req, res) {
   *   try {
   *     const result = await deleteRecipeUseCase.execute(req.params.id);
   *     res.status(200).json({
   *       message: 'Recipe deleted successfully',
   *       recipe: result
   *     });
   *   } catch (error) {
   *     if (error instanceof RecipeNotFoundException) {
   *       res.status(404).json({ error: error.message });
   *     } else {
   *       res.status(500).json({ error: 'Internal server error' });
   *     }
   *   }
   * }
   */
  async execute(recipeId) {
    // Execute the soft delete operation via the repository
    // The repository's delete() method sets isActive to false and returns the updated recipe
    // Returns null if the recipe doesn't exist or if the ID format is invalid
    const recipe = await this.recipeRepository.delete(recipeId);

    // Validate that the recipe exists and was successfully soft-deleted
    // Throw a domain-specific exception with a 404 status code if not found
    if (!recipe) {
      throw new RecipeNotFoundException(recipeId);
    }

    // Return the deactivated recipe entity for confirmation or logging purposes
    // The recipe will have isActive: false and an updated timestamp
    return recipe;
  }
}

export default DeleteRecipeUseCase;

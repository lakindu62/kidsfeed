/**
 * GetRecipeUseCase
 *
 * Application service responsible for retrieving a single recipe by its unique identifier.
 * This use case implements the Query pattern from Clean Architecture, encapsulating
 * the business logic for fetching and validating recipe existence.
 *
 * Responsibilities:
 * 1. Retrieve a recipe from the repository using the provided ID
 * 2. Validate that the recipe exists (throw exception if not found)
 * 3. Return the recipe domain entity to the caller
 *
 * This use case ensures consistent error handling across the application by
 * throwing a domain-specific RecipeNotFoundException when a recipe doesn't exist,
 * rather than returning null or undefined.
 *
 * This use case is independent of the delivery mechanism (REST API, GraphQL, CLI),
 * making it reusable across different interfaces and easy to test in isolation.
 *
 * @class GetRecipeUseCase
 * @module menu-management/application/use-cases/recipe/GetRecipeUseCase
 *
 * @example
 * const useCase = new GetRecipeUseCase(recipeRepository);
 * try {
 *   const recipe = await useCase.execute('64f1a2b3c4d5e6f7a8b9c0d1');
 *   console.log(recipe.name);
 * } catch (error) {
 *   if (error instanceof RecipeNotFoundException) {
 *     console.log('Recipe not found');
 *   }
 * }
 */
import RecipeNotFoundException from '../../../domain/exceptions/RecipeNotFoundException';

class GetRecipeUseCase {
  /**
   * Initializes the use case with required dependencies
   *
   * @constructor
   * @param {IRecipeRepository} recipeRepository - Repository for retrieving recipes
   *
   * @example
   * const useCase = new GetRecipeUseCase(mongoRecipeRepository);
   */
  constructor(recipeRepository) {
    /**
     * Repository instance for retrieving recipes
     * @type {IRecipeRepository}
     * @private
     */
    this.recipeRepository = recipeRepository;
  }

  /**
   * Executes the recipe retrieval workflow
   *
   * Retrieves a recipe by its unique identifier and ensures it exists.
   * If the recipe is not found, throws a RecipeNotFoundException
   * to maintain consistent error handling across the application layer.
   *
   * @async
   * @param {string} recipeId - The unique identifier of the recipe to retrieve
   * @returns {Promise<Recipe>} The found Recipe domain entity
   * @throws {RecipeNotFoundException} If no recipe exists with the given ID
   * @throws {Error} If the repository operation fails (e.g., database connection error)
   *
   * @example
   * // Successful retrieval
   * const recipe = await getRecipeUseCase.execute('64f1a2b3c4d5e6f7a8b9c0d1');
   * console.log(recipe.name); // 'Spaghetti Carbonara'
   *
   * @example
   * // Recipe not found
   * try {
   *   await getRecipeUseCase.execute('invalid-id');
   * } catch (error) {
   *   console.log(error.name);       // 'RecipeNotFoundException'
   *   console.log(error.statusCode); // 404
   *   console.log(error.recipeId);   // 'invalid-id'
   * }
   */
  async execute(recipeId) {
    // Attempt to retrieve the recipe from the repository
    // Returns null if the recipe doesn't exist or if the ID format is invalid
    const recipe = await this.recipeRepository.findById(recipeId);

    // Validate that the recipe exists
    // Throw a domain-specific exception with a 404 status code if not found
    if (!recipe) {
      throw new RecipeNotFoundException(recipeId);
    }

    // Return the recipe domain entity to the caller
    return recipe;
  }
}

export default GetRecipeUseCase;

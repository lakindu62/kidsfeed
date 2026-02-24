/**
 * GetAllRecipesUseCase
 *
 * Application service responsible for retrieving a paginated and filtered list of recipes.
 * This use case implements the Query pattern from Clean Architecture, providing a clean
 * interface for fetching multiple recipes with optional filtering and pagination.
 *
 * Responsibilities:
 * 1. Accept filter criteria and pagination parameters from the caller
 * 2. Delegate the query to the repository layer
 * 3. Return paginated results with metadata (total count, page info)
 *
 * This use case acts as a thin wrapper around the repository's findAll method,
 * ensuring consistency in how list queries are performed across the application.
 * It provides a stable interface that can be extended with additional business
 * logic (e.g., access control, result transformation) without affecting the repository.
 *
 * This use case is independent of the delivery mechanism (REST API, GraphQL, CLI),
 * making it reusable across different interfaces and easy to test in isolation.
 *
 * @class GetAllRecipesUseCase
 * @module menu-management/application/use-cases/recipe/GetAllRecipesUseCase
 *
 * @example
 * const useCase = new GetAllRecipesUseCase(recipeRepository);
 * const result = await useCase.execute(
 *   { vegetarian: true, glutenFree: true },
 *   { page: 1, limit: 20 }
 * );
 * console.log(result.recipes);    // Array of Recipe entities
 * console.log(result.total);      // Total matching recipes
 * console.log(result.totalPages); // Total pages available
 */
class GetAllRecipesUseCase {
  /**
   * Initializes the use case with required dependencies
   *
   * @constructor
   * @param {IRecipeRepository} recipeRepository - Repository for retrieving recipes
   *
   * @example
   * const useCase = new GetAllRecipesUseCase(mongoRecipeRepository);
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
   * Executes the recipe list retrieval workflow
   *
   * Retrieves a paginated list of recipes from the repository, optionally filtered
   * by dietary flags. Returns recipes along with pagination metadata to support
   * efficient list rendering and navigation in client applications.
   *
   * All queries automatically filter for active recipes only (isActive: true).
   *
   * @async
   * @param {Object} [filters={}] - Optional dietary flag filters to narrow results
   * @param {boolean} [filters.vegetarian] - Filter for vegetarian recipes only
   * @param {boolean} [filters.vegan] - Filter for vegan recipes only
   * @param {boolean} [filters.halal] - Filter for halal recipes only
   * @param {boolean} [filters.glutenFree] - Filter for gluten-free recipes only
   * @param {boolean} [filters.dairyFree] - Filter for dairy-free recipes only
   * @param {boolean} [filters.nutFree] - Filter for nut-free recipes only
   * @param {Object} [pagination={page:1,limit:10}] - Pagination configuration
   * @param {number} [pagination.page=1] - Page number to retrieve (1-based index)
   * @param {number} [pagination.limit=10] - Number of recipes per page
   * @returns {Promise<Object>} Paginated result object with recipes and metadata
   * @returns {Promise<Array<Recipe>>} returns.recipes - Array of Recipe domain entities for the requested page
   * @returns {Promise<number>} returns.total - Total number of matching recipes (across all pages)
   * @returns {Promise<number>} returns.page - Current page number
   * @returns {Promise<number>} returns.totalPages - Total number of pages available
   * @throws {Error} If the repository query fails (e.g., database connection error)
   *
   * @example
   * // Get all active recipes (no filters, default pagination)
   * const result = await getAllRecipesUseCase.execute();
   * console.log(result.recipes.length); // Up to 10 recipes
   * console.log(result.total);          // Total active recipes in database
   *
   * @example
   * // Get vegetarian and gluten-free recipes, page 2 with 20 per page
   * const result = await getAllRecipesUseCase.execute(
   *   { vegetarian: true, glutenFree: true },
   *   { page: 2, limit: 20 }
   * );
   * console.log(result.recipes.length); // Up to 20 recipes
   * console.log(result.page);           // 2
   *
   * @example
   * // Get all vegan recipes (all pages) by paginating through results
   * let allVeganRecipes = [];
   * let currentPage = 1;
   * let totalPages = 1;
   *
   * while (currentPage <= totalPages) {
   *   const result = await getAllRecipesUseCase.execute(
   *     { vegan: true },
   *     { page: currentPage, limit: 50 }
   *   );
   *   allVeganRecipes.push(...result.recipes);
   *   totalPages = result.totalPages;
   *   currentPage++;
   * }
   */
  async execute(filters = {}, pagination = { page: 1, limit: 10 }) {
    // Delegate the query to the repository layer
    // The repository handles the actual database query, filtering, and pagination logic
    return await this.recipeRepository.findAll(filters, pagination);
  }
}

export default GetAllRecipesUseCase;

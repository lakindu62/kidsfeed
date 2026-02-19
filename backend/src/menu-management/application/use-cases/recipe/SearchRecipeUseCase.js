/**
 * SearchRecipeUseCase
 *
 * Application service responsible for orchestrating recipe search operations.
 * This use case implements the Query pattern from Clean Architecture, providing
 * specialized search capabilities beyond basic list queries.
 *
 * Responsibilities:
 * 1. Search recipes by ingredient name (partial, case-insensitive matching)
 * 2. Search recipes by dietary flags (matching all specified flags)
 * 3. Validate search criteria before executing queries
 * 4. Return matching recipes as domain entities
 *
 * Search Capabilities:
 * - Ingredient Search: Finds recipes containing a specific ingredient
 *   (supports partial matches, e.g., "chick" matches "chicken breast")
 * - Dietary Flag Search: Finds recipes matching all specified dietary requirements
 *   (e.g., both vegetarian AND gluten-free)
 *
 * This use case is independent of the delivery mechanism (REST API, GraphQL, CLI),
 * making it reusable across different interfaces and easy to test in isolation.
 *
 * @class SearchRecipeUseCase
 * @module menu-management/application/use-cases/recipe/SearchRecipeUseCase
 *
 * @example
 * const useCase = new SearchRecipeUseCase(recipeRepository);
 *
 * // Search by ingredient
 * const chickenRecipes = await useCase.searchByIngredients('chicken');
 *
 * // Search by dietary flags
 * const veganRecipes = await useCase.searchDietaryFlags({
 *   vegan: true,
 *   nutFree: true
 * });
 */
class SearchRecipeUseCase {
  /**
   * Initializes the use case with required dependencies
   *
   * @constructor
   * @param {IRecipeRepository} recipeRepository - Repository for executing search queries
   *
   * @example
   * const useCase = new SearchRecipeUseCase(mongoRecipeRepository);
   */
  constructor(recipeRepository) {
    /**
     * Repository instance for executing search queries
     * @type {IRecipeRepository}
     * @private
     */
    this.recipeRepository = recipeRepository;
  }

  /**
   * Searches for active recipes containing a specific ingredient
   *
   * Performs a case-insensitive partial match on ingredient names across all
   * active recipes. Validates that the ingredient name is not empty before
   * executing the search. Trims whitespace from the search term automatically.
   *
   * @async
   * @param {string} ingredientName - The ingredient name or partial name to search for
   * @returns {Promise<Array<Recipe>>} Array of Recipe domain entities containing the ingredient
   * @throws {Error} If ingredientName is null, undefined, empty, or only whitespace
   * @throws {Error} If the repository search operation fails
   *
   * @example
   * // Find all recipes with chicken
   * const recipes = await searchRecipeUseCase.searchByIngredients('chicken');
   * console.log(recipes.length); // Number of matching recipes
   *
   * @example
   * // Partial match - finds "chicken breast", "chicken thigh", etc.
   * const recipes = await searchRecipeUseCase.searchByIngredients('chick');
   *
   * @example
   * // Validation error - empty string
   * try {
   *   await searchRecipeUseCase.searchByIngredients('   ');
   * } catch (error) {
   *   console.log(error.message); // 'Ingredient name is required for search'
   * }
   */
  async searchByIngredient(ingredientName) {
    // Validate that the ingredient name is provided and not empty
    if (!ingredientName || ingredientName.trim().length === 0) {
      throw new Error('Ingredient name is required for search');
    }

    // Execute the search query with trimmed ingredient name
    await this.recipeRepository.searchByIngredient(ingredientName.trim());
  }

  /**
   * Searches for active recipes matching all specified dietary flags
   *
   * Finds recipes that satisfy ALL dietary requirements provided in the flags object.
   * For example, if searching for { vegetarian: true, glutenFree: true }, only recipes
   * that are BOTH vegetarian AND gluten-free will be returned.
   *
   * Validates that at least one dietary flag is provided before executing the search.
   *
   * @async
   * @param {Object} flags - Dietary flags to filter recipes by (at least one required)
   * @param {boolean} [flags.vegetarian] - Filter for vegetarian recipes
   * @param {boolean} [flags.vegan] - Filter for vegan recipes
   * @param {boolean} [flags.halal] - Filter for halal recipes
   * @param {boolean} [flags.glutenFree] - Filter for gluten-free recipes
   * @param {boolean} [flags.dairyFree] - Filter for dairy-free recipes
   * @param {boolean} [flags.nutFree] - Filter for nut-free recipes
   * @returns {Promise<Array<Recipe>>} Array of Recipe domain entities matching ALL specified flags
   * @throws {Error} If flags is null, undefined, or an empty object
   * @throws {Error} If the repository search operation fails
   *
   * @example
   * // Find recipes that are both vegan and gluten-free
   * const recipes = await searchRecipeUseCase.searchDietaryFlags({
   *   vegan: true,
   *   glutenFree: true
   * });
   *
   * @example
   * // Find halal and nut-free recipes
   * const recipes = await searchRecipeUseCase.searchDietaryFlags({
   *   halal: true,
   *   nutFree: true
   * });
   *
   * @example
   * // Validation error - empty flags object
   * try {
   *   await searchRecipeUseCase.searchDietaryFlags({});
   * } catch (error) {
   *   console.log(error.message); // 'At least one dietary flag is required for search'
   * }
   *
   * @example
   * // Use in an API endpoint for filtered search
   * app.get('/api/recipes/search/dietary', async (req, res) => {
   *   try {
   *     const flags = {
   *       vegetarian: req.query.vegetarian === 'true',
   *       halal: req.query.halal === 'true'
   *     };
   *     // Remove false flags
   *     Object.keys(flags).forEach(key => !flags[key] && delete flags[key]);
   *
   *     const recipes = await searchRecipeUseCase.searchDietaryFlags(flags);
   *     res.json({ recipes, count: recipes.length });
   *   } catch (error) {
   *     res.status(400).json({ error: error.message });
   *   }
   * });
   */
  async searchDietaryFlags(flags) {
    // Validate that at least one dietary flag is provided
    // This ensures meaningful search criteria and prevents fetching all recipes
    if (!flags || Object.keys(flags).length === 0) {
      throw new Error('At least one dietary flag is required for search');
    }

    // Execute the search query with the provided dietary flags
    // Returns recipes that match ALL specified flags (AND operation)
    return await this.recipeRepository.findByDietaryFlags(flags);
  }
}

export default SearchRecipeUseCase;

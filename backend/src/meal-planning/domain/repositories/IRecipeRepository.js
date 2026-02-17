/**
 * IRecipeRepository Interface
 *
 * Abstract repository interface that defines the contract for all recipe
 * data access operations. This interface follows the Repository Pattern
 * from Domain-Driven Design (DDD), decoupling the domain layer from
 * the underlying data persistence mechanism.
 *
 * All concrete repository implementations (e.g., MongoDB, PostgreSQL,
 * in-memory) must extend this class and implement every method.
 * Calling any method on this base class directly will throw an error,
 * enforcing the implementation contract.
 *
 * @class IRecipeRepository
 * @abstract
 *
 * @example
 * // Creating a concrete implementation
 * class MongoRecipeRepository extends IRecipeRepository {
 *   async save(recipe) {
 *     return await RecipeModel.create(recipe);
 *   }
 *   // ... other method implementations
 * }
 */
class IRecipeRepository {
  /**
   * Persists a new recipe to the data store
   *
   * @async
   * @abstract
   * @param {Recipe} _recipe - The recipe domain object to be saved
   * @returns {Promise<Recipe>} The saved recipe, typically with generated ID and timestamps
   * @throws {Error} If the method is not implemented by a concrete subclass
   *
   * @example
   * const savedRecipe = await recipeRepository.save(newRecipe);
   * console.log(savedRecipe.id); // auto-generated ID
   */
  async save(_recipe) {
    throw new Error('IRecipeRepository.save() must be implemented');
  }

  /**
   * Retrieves a single recipe by its unique identifier
   *
   * @async
   * @abstract
   * @param {string} _id - The unique identifier of the recipe to retrieve
   * @returns {Promise<Recipe|null>} The found recipe, or null if not found
   * @throws {Error} If the method is not implemented by a concrete subclass
   *
   * @example
   * const recipe = await recipeRepository.findById('recipe-123');
   * if (!recipe) {
   *   throw new RecipeNotFoundException('recipe-123');
   * }
   */
  async findById(_id) {
    throw new Error('IRecipeRepository.findById() must be implemented');
  }

  /**
   * Retrieves a list of recipes based on optional filters and pagination
   *
   * @async
   * @abstract
   * @param {Object} _filters - Filtering criteria to narrow the results
   * @param {boolean} [_filters.isActive] - Filter by active or inactive recipes
   * @param {string} [_filters.mealType] - Filter by meal type (e.g., 'breakfast', 'lunch')
   * @param {Array<string>} [_filters.seasonal] - Filter by seasonal availability
   * @param {Object} _pagination - Pagination configuration object
   * @param {number} _pagination.page - The page number (1-based index)
   * @param {number} _pagination.limit - Number of records per page
   * @returns {Promise<Object>} Paginated result containing recipes and metadata
   * @returns {Promise<Array<Recipe>>} returns.recipes - Array of recipe objects
   * @returns {Promise<number>} returns.total - Total number of matching records
   * @returns {Promise<number>} returns.page - Current page number
   * @returns {Promise<number>} returns.limit - Records per page
   * @throws {Error} If the method is not implemented by a concrete subclass
   *
   * @example
   * const result = await recipeRepository.findAll(
   *   { isActive: true, mealType: 'breakfast' },
   *   { page: 1, limit: 10 }
   * );
   * console.log(result.recipes); // Array of recipes
   * console.log(result.total);   // Total matching records
   */
  async findAll(_filters, _pagination) {
    throw new Error('IRecipeRepository.findAll() must be implemented');
  }

  /**
   * Updates an existing recipe in the data store
   *
   * @async
   * @abstract
   * @param {string} _id - The unique identifier of the recipe to update
   * @param {Partial<Recipe>} _recipe - The fields to update on the recipe
   * @returns {Promise<Recipe>} The updated recipe with all fields
   * @throws {Error} If the method is not implemented by a concrete subclass
   * @throws {RecipeNotFoundException} If no recipe exists with the given ID (implementation-specific)
   *
   * @example
   * const updatedRecipe = await recipeRepository.update(
   *   'recipe-123',
   *   { name: 'Updated Recipe Name', isActive: false }
   * );
   */
  async update(_id, _recipe) {
    throw new Error('IRecipeRepository.update() must be implemented');
  }

  /**
   * Searches for recipes that contain a specific ingredient
   *
   * @async
   * @abstract
   * @param {string} _ingredientName - The name of the ingredient to search for
   * @returns {Promise<Array<Recipe>>} Array of recipes containing the specified ingredient
   * @throws {Error} If the method is not implemented by a concrete subclass
   *
   * @example
   * // Find all recipes that use chicken
   * const chickenRecipes = await recipeRepository.searchByIngredient('chicken');
   */
  async searchByIngredient(_ingredientName) {
    throw new Error(
      'IRecipeRepository.searchByIngredient() must be implemented'
    );
  }

  /**
   * Retrieves recipes that match all specified dietary flags
   *
   * @async
   * @abstract
   * @param {Object} _flags - Dietary flags to filter recipes by
   * @param {boolean} [_flags.vegetarian] - Filter for vegetarian recipes
   * @param {boolean} [_flags.vegan] - Filter for vegan recipes
   * @param {boolean} [_flags.halal] - Filter for halal recipes
   * @param {boolean} [_flags.glutenFree] - Filter for gluten-free recipes
   * @param {boolean} [_flags.dairyFree] - Filter for dairy-free recipes
   * @param {boolean} [_flags.nutFree] - Filter for nut-free recipes
   * @returns {Promise<Array<Recipe>>} Array of recipes matching all specified dietary flags
   * @throws {Error} If the method is not implemented by a concrete subclass
   *
   * @example
   * // Find all recipes that are both vegan and gluten-free
   * const recipes = await recipeRepository.findByDietaryFlags({
   *   vegan: true,
   *   glutenFree: true
   * });
   */
  async findByDietaryFlags(_flags) {
    throw new Error(
      'IRecipeRepository.findByDietaryFlags() must be implemented'
    );
  }
}

module.exports = IRecipeRepository;

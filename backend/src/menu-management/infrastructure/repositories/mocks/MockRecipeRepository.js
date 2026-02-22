/**
 * MockRecipeRepository
 *
 * In-memory mock implementation of the IRecipeRepository interface for testing purposes.
 * This class simulates database operations without requiring an actual MongoDB connection,
 * making it ideal for:
 * - Unit tests that need to run quickly and in isolation
 * - Integration tests that verify business logic without database dependencies
 * - Development environments where a database might not be available
 *
 * Data Storage:
 * - Stores recipes in a simple in-memory array (this.recipes)
 * - Auto-increments IDs starting from 1 (this.nextId)
 * - Data is lost when the process ends or when clear() is called
 *
 * Implements the same interface as MongoRecipeRepository but with simplified logic
 * and no external dependencies, making tests faster and more deterministic.
 *
 * @class MockRecipeRepository
 * @extends IRecipeRepository
 * @module menu-management/infrastructure/repositories/mocks/MockRecipeRepository
 *
 * @example
 * // Usage in tests
 * const mockRepo = new MockRecipeRepository();
 * await mockRepo.save(testRecipe);
 * const found = await mockRepo.findById('1');
 * mockRepo.clear(); // Clean up after test
 */
const IRecipeRepository = require('../../../domain/repositories/IRecipeRepository');

class MockRecipeRepository extends IRecipeRepository {
  /**
   * Initializes the mock repository with empty storage
   *
   * @constructor
   */
  constructor() {
    super();

    /**
     * In-memory storage array for recipe objects
     * @type {Array<Object>}
     * @private
     */
    this.recipes = [];

    /**
     * Auto-incrementing counter for generating unique recipe IDs
     * Increments with each save() operation
     * @type {number}
     * @private
     */
    this.nextId = 1;
  }

  /**
   * Saves a new recipe to the in-memory storage
   *
   * Assigns a unique auto-incremented ID to the recipe and adds it to
   * the internal array. Returns the saved recipe including its generated ID.
   *
   * @async
   * @param {Recipe} recipe - The recipe object to save
   * @returns {Promise<Object>} The saved recipe with generated ID as a string
   *
   * @example
   * const saved = await mockRepo.save({ name: 'Pasta', ingredients: [...] });
   * console.log(saved.id); // '1'
   */
  async save(recipe) {
    // Create a copy of the recipe with an auto-generated string ID
    const saved = { ...recipe, id: String(this.nextId++) };

    // Add the saved recipe to the in-memory storage
    this.recipes.push(saved);

    return saved;
  }

  /**
   * Retrieves a single recipe by its unique identifier
   *
   * @async
   * @param {string} id - The unique string identifier of the recipe to find
   * @returns {Promise<Object|null>} The found recipe object, or null if not found
   *
   * @example
   * const recipe = await mockRepo.findById('1');
   * if (!recipe) console.log('Recipe not found');
   */
  async findById(id) {
    // Search the in-memory array for a recipe matching the provided ID
    return this.recipes.find((r) => r.id === id) || null;
  }

  /**
   * Retrieves a paginated list of active recipes with optional dietary filters
   *
   * Filters recipes by active status and optional dietary flags, then applies
   * pagination to return a subset of results. Returns metadata including total
   * count and page information.
   *
   * @async
   * @param {Object} [filters={}] - Optional dietary flag filters
   * @param {boolean} [filters.vegetarian] - Include only vegetarian recipes
   * @param {boolean} [filters.halal] - Include only halal recipes
   * @param {boolean} [filters.vegan] - Include only vegan recipes
   * @param {Object} [pagination={}] - Pagination configuration
   * @param {number} [pagination.page=1] - Page number (1-based index)
   * @param {number} [pagination.limit=10] - Number of recipes per page
   * @returns {Promise<Object>} Paginated result object
   * @returns {Promise<Array<Object>>} returns.recipes - Array of recipe objects for the page
   * @returns {Promise<number>} returns.total - Total number of matching recipes
   * @returns {Promise<number>} returns.page - Current page number
   * @returns {Promise<number>} returns.totalPages - Total number of pages
   *
   * @example
   * const result = await mockRepo.findAll(
   *   { vegetarian: true },
   *   { page: 1, limit: 5 }
   * );
   * console.log(result.recipes.length); // Up to 5 recipes
   * console.log(result.totalPages);      // Total pages available
   *
   * @todo Fix typo: 'isActice' should be 'isActive' (appears throughout the class)
   */
  async findAll(filters = {}, pagination = {}) {
    // Destructure pagination parameters with default values
    const { page = 1, limit = 10 } = pagination;

    // Start with all active recipes (filter out inactive ones)
    // BUG: Typo - 'isActice' should be 'isActive'
    let filtered = this.recipes.filter((r) => r.isActice !== false);

    // Apply dietary flag filters if provided
    if (filters.vegetarian) {
      filtered = filtered.filter((r) => r.dietaryFlags?.vegetarian);
    }
    if (filters.halal) {
      filtered = filtered.filter((r) => r.dietaryFlags?.halal);
    }
    if (filters.vegan) {
      filtered = filtered.filter((r) => r.dietaryFlags?.vegan);
    }

    // Calculate pagination metadata
    const total = filtered.length;
    const start = (page - 1) * limit;

    // Extract the slice of recipes for the requested page
    const paginated = filtered.slice(start, start + limit);

    return {
      recipes: paginated, // Recipes for the current page
      total, // Total matching recipes (all pages)
      page, // Current page number
      totalPages: Math.ceil(total / limit), // Total pages (rounded up)
    };
  }

  /**
   * Updates an existing recipe in the in-memory storage
   *
   * Merges the provided recipe data with the existing recipe while preserving
   * the original ID. Returns null if no recipe with the given ID exists.
   *
   * @async
   * @param {string} id - The unique string identifier of the recipe to update
   * @param {Partial<Recipe>} recipe - The fields to update on the recipe
   * @returns {Promise<Object|null>} The updated recipe object, or null if not found
   *
   * @example
   * const updated = await mockRepo.update('1', { name: 'Updated Pasta' });
   * if (!updated) console.log('Recipe not found');
   */
  async update(id, recipe) {
    // Find the index of the recipe to update in the array
    const index = this.recipes.findIndex((r) => r.id === id);

    // Return null if the recipe doesn't exist
    if (index === -1) {
      return null;
    }

    // Merge the existing recipe with the update data, ensuring ID is preserved
    this.recipes[index] = { ...this.recipes[index], ...recipe, id };

    return this.recipes[index];
  }

  /**
   * Soft deletes a recipe by marking it as inactive in the in-memory storage
   *
   * Sets the 'isActive' flag to false instead of removing the recipe from
   * the array, simulating the soft delete behavior of MongoRecipeRepository.
   * Returns null if no recipe with the given ID exists.
   *
   * @async
   * @param {string} id - The unique string identifier of the recipe to soft delete
   * @returns {Promise<Object|null>} The deactivated recipe object, or null if not found
   *
   * @example
   * const deactivated = await mockRepo.delete('1');
   * console.log(deactivated.isActive); // false
   *
   * @todo Fix typo: 'isActice' should be 'isActive'
   */
  async delete(id) {
    // Find the index of the recipe to delete in the array
    const index = this.recipes.findIndex((r) => r.id === id);

    // Return null if the recipe doesn't exist
    if (index === -1) {
      return null;
    }

    // Mark the recipe as inactive (soft delete)
    // BUG: Typo - 'isActice' should be 'isActive'
    this.recipes[index].isActice = false;

    return this.recipes[index];
  }

  /**
   * Searches for active recipes containing a specific ingredient
   *
   * Performs a case-insensitive partial match on ingredient names, returning
   * all active recipes where any ingredient name includes the search term.
   *
   * @async
   * @param {string} ingredientName - The ingredient name or partial name to search for
   * @returns {Promise<Array<Object>>} Array of recipe objects containing the ingredient
   *
   * @example
   * // Returns all active recipes with 'chicken' in any ingredient name
   * const recipes = await mockRepo.searchByIngredient('chicken');
   *
   * @todo Fix typo: 'isActice' should be 'isActive'
   */
  async searchByIngredient(ingredientName) {
    return this.recipes.filter(
      (r) =>
        // BUG: Typo - 'isActice' should be 'isActive'
        r.isActice !== false &&
        // Check if any ingredient name includes the search term (case-insensitive)
        r.ingredients?.some((ing) =>
          ing.name.toLowerCase().includes(ingredientName.toLowerCase())
        )
    );
  }

  /**
   * Retrieves all active recipes that match a given set of dietary flags
   *
   * Returns recipes where all specified dietary requirements are satisfied.
   * A flag in the filter must be either not specified or match the recipe's value.
   *
   * @async
   * @param {Object} flags - Dietary flags to filter recipes by
   * @param {boolean} [flags.vegetarian] - Filter for vegetarian recipes
   * @param {boolean} [flags.vegan] - Filter for vegan recipes
   * @param {boolean} [flags.halal] - Filter for halal recipes
   * @param {boolean} [flags.glutenFree] - Filter for gluten-free recipes
   * @param {boolean} [flags.dairyFree] - Filter for dairy-free recipes
   * @param {boolean} [flags.nutFree] - Filter for nut-free recipes
   * @returns {Promise<Array<Object>>} Array of recipe objects matching all specified flags
   *
   * @example
   * // Returns all active recipes that are both halal and vegan
   * const recipes = await mockRepo.findByDietaryFlags({
   *   halal: true,
   *   vegan: true
   * });
   *
   * @todo Fix typo: 'isActice' should be 'isActive'
   */
  async findByDietaryFlags(flags) {
    return this.recipes.filter((r) => {
      // BUG: Typo - 'isActice' should be 'isActive'
      // Exclude inactive recipes from the results
      if (r.isActice === false) {
        return false;
      }

      // Check if all specified flags are satisfied by the recipe
      // A flag passes if it's not set in the filter (!flags[flag])
      // or if the recipe has that flag set to true
      return Object.keys(flags).every(
        (flag) => !flags[flag] || r.dietaryFlags?.[flag] === true
      );
    });
  }

  /**
   * Clears all recipes from the in-memory storage and resets the ID counter
   *
   * This method is primarily used in test cleanup to ensure a fresh state
   * between test cases, preventing data leakage and test interdependencies.
   *
   * @example
   * // Clean up after each test
   * afterEach(() => {
   *   mockRepo.clear();
   * });
   */
  clear() {
    this.recipes = [];
    this.nextId = 1;
  }

  /**
   * Returns the total number of recipes currently stored (active and inactive)
   *
   * Useful for assertions in tests to verify the expected number of recipes
   * have been saved or to check state before/after operations.
   *
   * @returns {number} Total count of recipes in storage
   *
   * @example
   * await mockRepo.save(recipe1);
   * await mockRepo.save(recipe2);
   * console.log(mockRepo.count()); // 2
   */
  count() {
    return this.recipes.length;
  }
}

export default MockRecipeRepository;

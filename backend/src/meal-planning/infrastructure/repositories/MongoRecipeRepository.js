/**
 * MongoRecipeRepository
 *
 * Concrete MongoDB implementation of the IRecipeRepository interface.
 * This class is responsible for all recipe-related database operations,
 * acting as the bridge between the domain layer and MongoDB persistence.
 *
 * Implements the Repository Pattern from Domain-Driven Design (DDD):
 * - Accepts and returns domain entities (Recipe), not raw MongoDB documents
 * - Uses RecipeMapper to translate between domain and persistence representations
 * - Encapsulates all MongoDB-specific query logic within this class
 * - Wraps all operations in try/catch blocks to handle and standardize errors
 *
 * Soft Delete Strategy:
 * - Recipes are never permanently deleted from the database
 * - The delete() method sets 'isActive: false' to preserve historical data
 * - All read queries filter by 'isActive: true' to exclude soft-deleted records
 *
 * @class MongoRecipeRepository
 * @extends IRecipeRepository
 * @module meal-planning/infrastructure/repositories/MongoRecipeRepository
 */
const IRecipeRepository = require('../../domain/repositories/IRecipeRepository');
const RecipeSchema = require('../schemas/RecipeSchema');
const RecipeMapper = require('./mappers/RecipeMapper');

class MongoRecipeRepository extends IRecipeRepository {
  /**
   * Persists a new Recipe domain entity to MongoDB
   *
   * Converts the domain entity to a persistence object using RecipeMapper,
   * saves it to the 'recipes' collection, then maps the saved document back
   * to a domain entity (which includes the auto-generated MongoDB _id).
   *
   * @async
   * @param {Recipe} recipe - The Recipe domain entity to persist
   * @returns {Promise<Recipe>} The saved Recipe domain entity with generated ID and timestamps
   * @throws {Error} If the save operation fails due to validation or database errors
   *
   * @example
   * const savedRecipe = await recipeRepository.save(newRecipe);
   * console.log(savedRecipe.id); // MongoDB-generated ID as string
   *
   * @todo Add 'await' before RecipeSchema.create() — currently missing,
   *       which means savedDoc will be a Promise, not a document,
   *       causing toDomain() to receive incorrect input and return null
   */
  async save(recipe) {
    try {
      // Convert the domain entity to a plain object for MongoDB storage
      const persistenceData = RecipeMapper.toPersistence(recipe);

      // Persist the plain object to MongoDB and retrieve the saved document
      // BUG: Missing 'await' — should be: await RecipeSchema.create(persistenceData)
      const savedDoc = RecipeSchema.create(persistenceData);

      // Map the saved MongoDB document back to a domain entity and return it
      return RecipeMapper.toDomain(savedDoc);
    } catch (error) {
      throw new Error(`Failed to save recipe: ${error.message}`);
    }
  }

  /**
   * Retrieves a single Recipe by its unique identifier
   *
   * Returns null instead of throwing if the recipe is not found or if the
   * provided ID is not a valid MongoDB ObjectId (CastError).
   *
   * @async
   * @param {string} id - The unique string identifier of the recipe to find
   * @returns {Promise<Recipe|null>} The found Recipe domain entity, or null if not found
   * @throws {Error} If the query fails for any reason other than an invalid ID format
   *
   * @example
   * const recipe = await recipeRepository.findById('64f1a2b3c4d5e6f7a8b9c0d1');
   * if (!recipe) {
   *   throw new RecipeNotFoundException(id);
   * }
   */
  async findById(id) {
    try {
      // Query MongoDB for the document matching the provided ID
      const doc = await RecipeSchema.findById(id);

      // Returns null automatically if doc is null (recipe not found)
      return RecipeMapper.toDomain(doc);
    } catch (error) {
      // CastError occurs when 'id' is not a valid MongoDB ObjectId format
      // Treat this as "not found" rather than a fatal error
      if (error.name === 'CastError') {
        return null;
      }

      throw new Error(`Failed to find recipe: ${error.message}`);
    }
  }

  /**
   * Retrieves a paginated list of active recipes with optional dietary filters
   *
   * Dynamically builds a MongoDB query based on the provided filters, then
   * applies pagination via skip/limit. Always filters for active recipes only.
   * Results are sorted by creation date in descending order (newest first).
   *
   * @async
   * @param {Object} [filters={}] - Optional dietary flag filters
   * @param {boolean} [filters.vegetarian] - Include only vegetarian recipes
   * @param {boolean} [filters.vegan] - Include only vegan recipes
   * @param {boolean} [filters.halal] - Include only halal recipes
   * @param {boolean} [filters.glutenFree] - Include only gluten-free recipes
   * @param {boolean} [filters.dairyFree] - Include only dairy-free recipes
   * @param {boolean} [filters.nutFree] - Include only nut-free recipes
   * @param {Object} [pagination={}] - Pagination configuration
   * @param {number} [pagination.page=1] - Page number (1-based index)
   * @param {number} [pagination.limit=10] - Number of recipes per page
   * @returns {Promise<Object>} Paginated result object
   * @returns {Promise<Array<Recipe>>} returns.recipes - Array of Recipe domain entities
   * @returns {Promise<number>} returns.total - Total number of matching records
   * @returns {Promise<number>} returns.page - Current page number
   * @returns {Promise<number>} returns.totalPage - Total number of pages
   * @throws {Error} If the query fails due to a database error
   *
   * @example
   * const result = await recipeRepository.findAll(
   *   { vegetarian: true, glutenFree: true },
   *   { page: 2, limit: 5 }
   * );
   * console.log(result.recipes);   // Array of Recipe domain entities
   * console.log(result.total);     // Total number of matching recipes
   * console.log(result.totalPage); // Total number of pages
   */
  async findAll(filters = {}, pagination = {}) {
    try {
      // Destructure pagination values with sensible defaults
      const { page = 1, limit = 10 } = pagination;

      // Calculate number of documents to skip for the requested page
      const skip = (page - 1) * limit;

      // Base query — always restrict results to active recipes only
      const query = { isActive: true };

      // Dynamically append dietary flag filters to the query
      // Only adds a flag condition if the filter is explicitly set to true
      if (filters.vegetarian === true) {
        query['dietaryFlags.vegetarian'] = true;
      }
      if (filters.vegan === true) {
        query['dietaryFlags.vegan'] = true;
      }
      if (filters.halal === true) {
        query['dietaryFlags.halal'] = true;
      }
      if (filters.glutenFree === true) {
        query['dietaryFlags.glutenFree'] = true;
      }
      if (filters.dairyFree === true) {
        query['dietaryFlags.dairyFree'] = true;
      }
      if (filters.nutFree === true) {
        query['dietaryFlags.nutFree'] = true;
      }

      // Execute paginated query, sorted by newest recipes first
      const docs = await RecipeSchema.find(query)
        .skip(skip) // Skip documents from previous pages
        .limit(limit) // Cap results to the requested page size
        .sort({ createdAt: -1 }); // Newest recipes appear first

      // Count total matching documents for pagination metadata
      const total = await RecipeSchema.countDocuments(query);

      return {
        recipes: RecipeMapper.toDomainList(docs), // Mapped domain entities
        total, // Total matching records
        page, // Current page number
        totalPage: Math.ceil(total / limit), // Total pages (rounded up)
      };
    } catch (error) {
      throw new Error(`Failed to find recipes: ${error.message}`);
    }
  }

  /**
   * Updates an existing Recipe document in MongoDB
   *
   * Converts the domain entity to persistence format, applies the update using
   * findByIdAndUpdate, and returns the updated document mapped back to a domain entity.
   * Returns null if no document with the given ID exists or if the ID is invalid.
   *
   * @async
   * @param {string} id - The unique string identifier of the recipe to update
   * @param {Recipe} recipe - The Recipe domain entity containing updated field values
   * @returns {Promise<Recipe|null>} The updated Recipe domain entity, or null if not found
   * @throws {Error} If the update fails due to validation or database errors
   *
   * @example
   * const updatedRecipe = await recipeRepository.update('64f1a2b3c4d5e6f7a8b9c0d1', recipe);
   * if (!updatedRecipe) {
   *   throw new RecipeNotFoundException(id);
   * }
   */
  async update(id, recipe) {
    try {
      // Convert the domain entity to a plain object for MongoDB update
      const persistenceData = RecipeMapper.toPersistence(recipe);

      const updatedDoc = await RecipeSchema.findByIdAndUpdate(
        id,
        persistenceData,
        {
          new: true, // Return the updated document instead of the original
          runValidators: true, // Enforce schema validation rules on the updated fields
        }
      );

      // Return null if no document was found with the provided ID
      if (!updatedDoc) {
        return null;
      }

      // Map the updated MongoDB document back to a domain entity
      return RecipeMapper.toDomain(updatedDoc);
    } catch (error) {
      // CastError occurs when 'id' is not a valid MongoDB ObjectId format
      // Treat this as "not found" rather than a fatal error
      if (error.name === 'CastError') {
        return null;
      }

      throw new Error(`Failed to update recipe: ${error.message}`);
    }
  }

  /**
   * Soft deletes a Recipe by marking it as inactive in MongoDB
   *
   * Instead of permanently removing the document, this method sets
   * 'isActive' to false, preserving the record for historical reporting,
   * auditing, and potential recovery. The soft-deleted recipe will be
   * excluded from all active recipe queries automatically.
   *
   * @async
   * @param {string} id - The unique string identifier of the recipe to soft delete
   * @returns {Promise<Recipe|null>} The deactivated Recipe domain entity, or null if not found
   * @throws {Error} If the update fails due to a database error
   *
   * @example
   * const deactivatedRecipe = await recipeRepository.delete('64f1a2b3c4d5e6f7a8b9c0d1');
   * if (!deactivatedRecipe) {
   *   throw new RecipeNotFoundException(id);
   * }
   * console.log(deactivatedRecipe.isActive); // false
   */
  async delete(id) {
    try {
      // Set isActive to false instead of removing the document (soft delete)
      const deletedDoc = await RecipeSchema.findByIdAndUpdate(
        id,
        { isActive: false }, // Deactivate the recipe rather than permanently deleting
        { new: true } // Return the updated document after deactivation
      );

      // Return null if no document was found with the provided ID
      if (!deletedDoc) {
        return null;
      }

      // Map the deactivated MongoDB document back to a domain entity
      return RecipeMapper.toDomain(deletedDoc);
    } catch (error) {
      // CastError occurs when 'id' is not a valid MongoDB ObjectId format
      // Treat this as "not found" rather than a fatal error
      if (error.name === 'CastError') {
        return null;
      }

      throw new Error(`Failed to delete recipe: ${error.message}`);
    }
  }

  /**
   * Searches for active recipes containing a specific ingredient
   *
   * Performs a case-insensitive partial match on the ingredient name
   * using a MongoDB regex query, allowing flexible searches such as
   * 'chick' matching 'chicken', 'chicken breast', etc.
   *
   * @async
   * @param {string} ingredientName - The ingredient name or partial name to search for
   * @returns {Promise<Array<Recipe>>} Array of Recipe domain entities containing the ingredient
   * @throws {Error} If the query fails due to a database error
   *
   * @example
   * // Returns all active recipes containing any form of 'chicken'
   * const recipes = await recipeRepository.searchByIngredient('chicken');
   */
  async searchByIngredient(ingredientName) {
    try {
      const docs = await RecipeSchema.find({
        isActive: true,
        'ingredients.name': {
          $regex: ingredientName, // Partial name matching
          $options: 'i', // 'i' flag = case-insensitive matching
        },
      });

      // Map the resulting MongoDB documents to domain entities
      return RecipeMapper.toDomainList(docs);
    } catch (error) {
      throw new Error(`Failed to search by ingredient: ${error.message}`);
    }
  }

  /**
   * Retrieves all active recipes that match a given set of dietary flags
   *
   * Dynamically builds a MongoDB query by iterating over the provided flags object,
   * including only flags explicitly set to true. All specified dietary requirements
   * must be satisfied for a recipe to be included in the results.
   *
   * @async
   * @param {Object} flags - Dietary flags to filter recipes by
   * @param {boolean} [flags.vegetarian] - Filter for vegetarian recipes
   * @param {boolean} [flags.vegan] - Filter for vegan recipes
   * @param {boolean} [flags.halal] - Filter for halal recipes
   * @param {boolean} [flags.glutenFree] - Filter for gluten-free recipes
   * @param {boolean} [flags.dairyFree] - Filter for dairy-free recipes
   * @param {boolean} [flags.nutFree] - Filter for nut-free recipes
   * @returns {Promise<Array<Recipe>>} Array of Recipe domain entities matching all specified flags
   * @throws {Error} If the query fails due to a database error
   *
   * @example
   * // Returns all active recipes that are both halal and nut-free
   * const recipes = await recipeRepository.findByDietaryFlags({
   *   halal: true,
   *   nutFree: true
   * });
   */
  async findByDietaryFlags(flags) {
    try {
      // Base query — always restrict results to active recipes only
      const query = { isActive: true };

      // Dynamically build the query by adding only flags explicitly set to true
      // Uses bracket notation to construct the nested dietaryFlags field path
      Object.keys(flags).forEach((flag) => {
        if (flags[flag] === true) {
          query[`dietaryFlags.${flag}`] = true;
        }
      });

      // Execute the query and map results to domain entities
      const docs = await RecipeSchema.find(query);
      return RecipeMapper.toDomainList(docs);
    } catch (error) {
      throw new Error(`Failed to find by dietary flags: ${error.message}`);
    }
  }
}

module.exports = MongoRecipeRepository;

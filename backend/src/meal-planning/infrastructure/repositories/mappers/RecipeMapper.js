/**
 * RecipeMapper
 *
 * Responsible for translating Recipe data between the domain layer and the
 * MongoDB persistence layer. This class implements the Mapper Pattern from
 * Domain-Driven Design (DDD), ensuring a clean separation between how data
 * is stored in the database and how it is represented as domain objects.
 *
 * Handles the conversion of:
 * - MongoDB documents → Domain entities (toDomain)
 * - Domain entities  → MongoDB documents (toPersistence)
 * - MongoDB document lists → Domain entity lists (toDomainList)
 *
 * Also reconstructs immutable value objects (NutritionalInfo, DietaryFlags)
 * from raw MongoDB data during domain mapping.
 *
 * @class RecipeMapper
 * @module meal-planning/infrastructure/repositories/mappers/RecipeMapper
 */

const Recipe = require('../../../domain/entities/Recipe');
const NutritionalInfo = require('../../../domain/value-objects/NutritionalInfo');
const DietaryFlags = require('../../../domain/value-objects/DietaryFlags');

class RecipeMapper {
  /**
   * Converts a raw MongoDB document into a Recipe domain entity
   *
   * Reconstructs the full domain object including nested value objects
   * (NutritionalInfo and DietaryFlags). Uses safe fallbacks for optional
   * fields to ensure a valid domain entity is always returned.
   *
   * @static
   * @param {Object|null} mongoDoc - The raw MongoDB document to convert
   * @param {string} mongoDoc._id - MongoDB ObjectId (converted to string for domain use)
   * @param {string} mongoDoc.name - Recipe name
   * @param {string} mongoDoc.description - Recipe description
   * @param {string} mongoDoc.instructions - Cooking instructions
   * @param {Array<Object>} mongoDoc.ingredients - List of ingredient objects
   * @param {Array<string>} [mongoDoc.allergens=[]] - List of allergen strings
   * @param {number} mongoDoc.servingSize - Number of servings
   * @param {number} mongoDoc.prepTime - Preparation time in minutes
   * @param {Array<string>} [mongoDoc.seasonal=[]] - Seasonal availability tags
   * @param {boolean} mongoDoc.isActive - Whether the recipe is active
   * @param {Date} mongoDoc.createdAt - Document creation timestamp
   * @param {Date} mongoDoc.updatedAt - Last update timestamp
   * @param {Object|null} [mongoDoc.nutritionalInfo=null] - Raw nutritional data
   * @param {Object} [mongoDoc.dietaryFlags={}] - Raw dietary flag data
   * @returns {Recipe|null} A fully reconstructed Recipe domain entity, or null if input is null
   *
   * @example
   * const domainRecipe = RecipeMapper.toDomain(mongoDocument);
   * console.log(domainRecipe instanceof Recipe);         // true
   * console.log(domainRecipe.dietaryFlags.isVegetarian) // true/false
   */
  static toDomain(mongoDoc) {
    // Return null early if no document is provided (e.g., findById returns null)
    if (!mongoDoc) {
      return null;
    }

    return new Recipe({
      // Convert MongoDB ObjectId to a plain string for domain layer use
      id: mongoDoc._id.toString(),

      // Map core recipe fields directly from the MongoDB document
      name: mongoDoc.name,
      description: mongoDoc.description,
      instructions: mongoDoc.instructions,
      ingredients: mongoDoc.ingredients,

      // Default to empty array if allergens field is absent in the document
      allergens: mongoDoc.allergens || [],

      servingSize: mongoDoc.servingSize,
      prepTime: mongoDoc.prepTime,

      // Default to empty array if seasonal field is absent in the document
      seasonal: mongoDoc.seasonal || [],

      isActive: mongoDoc.isActive,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,

      /**
       * Reconstruct NutritionalInfo value object from raw MongoDB data.
       * Returns null if nutritional data is not present in the document,
       * as nutritional info is optional for a recipe.
       */
      nutritionalInfo: mongoDoc.nutritionalInfo
        ? new NutritionalInfo({
            calories: mongoDoc.nutritionalInfo.calories,
            protein: mongoDoc.nutritionalInfo.protein,
            carbs: mongoDoc.nutritionalInfo.carbs,
            fats: mongoDoc.nutritionalInfo.fats,
            fiber: mongoDoc.nutritionalInfo.fiber,
            sugar: mongoDoc.nutritionalInfo.sugar,
          })
        : null,

      /**
       * Reconstruct DietaryFlags value object from raw MongoDB data.
       * Uses optional chaining (?.) and fallback to false for each flag
       * to safely handle documents where dietaryFlags may be missing or partial.
       */
      dietaryFlags: new DietaryFlags({
        vegetarian: mongoDoc.dietaryFlags?.vegetarian || false,
        vegan: mongoDoc.dietaryFlags?.vegan || false,
        halal: mongoDoc.dietaryFlags?.halal || false,
        glutenFree: mongoDoc.dietaryFlags?.glutenFree || false,
        dairyFree: mongoDoc.dietaryFlags?.dairyFree || false,
        nutFree: mongoDoc.dietaryFlags?.nutFree || false,
      }),
    });
  }

  /**
   * Converts a Recipe domain entity into a plain MongoDB-compatible document
   *
   * Strips away domain-specific behavior and value object wrappers, producing
   * a flat object suitable for MongoDB persistence. Only includes
   * nutritionalInfo and dietaryFlags if they are present on the domain entity,
   * avoiding storage of unnecessary null fields.
   *
   * @static
   * @param {Recipe} recipe - The Recipe domain entity to convert
   * @param {string} recipe.name - Recipe name
   * @param {string} recipe.description - Recipe description
   * @param {string} recipe.instructions - Cooking instructions
   * @param {Array<Object>} recipe.ingredients - List of ingredient objects
   * @param {Array<string>} recipe.allergens - List of allergen strings
   * @param {number} recipe.servingSize - Number of servings
   * @param {number} recipe.prepTime - Preparation time in minutes
   * @param {Array<string>} recipe.seasonal - Seasonal availability tags
   * @param {boolean} recipe.isActive - Whether the recipe is active
   * @param {NutritionalInfo|null} [recipe.nutritionalInfo] - NutritionalInfo value object
   * @param {DietaryFlags|null} [recipe.dietaryFlags] - DietaryFlags value object
   * @returns {Object} A plain object ready for MongoDB insert or update operations
   *
   * @example
   * const mongoDoc = RecipeMapper.toPersistence(domainRecipe);
   * await RecipeModel.create(mongoDoc);
   */
  static toPersistence(recipe) {
    // Build the base MongoDB document with all required core fields
    const mongoDoc = {
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,

      // Default to empty array if allergens are not set on the domain entity
      allergens: recipe.allergens || [],

      servingSize: recipe.servingSize,
      prepTime: recipe.prepTime,

      // Default to empty array if seasonal tags are not set on the domain entity
      seasonal: recipe.seasonal || [],

      isActive: recipe.isActive,
    };

    /**
     * Conditionally include nutritionalInfo only if present.
     * Extracts raw values from the NutritionalInfo value object
     * to avoid storing class instances in MongoDB.
     */
    if (recipe.nutritionalInfo) {
      mongoDoc.nutritionalInfo = {
        calories: recipe.nutritionalInfo.calories,
        protein: recipe.nutritionalInfo.protein,
        carbs: recipe.nutritionalInfo.carbs,
        fats: recipe.nutritionalInfo.fats,
        fiber: recipe.nutritionalInfo.fiber,
        sugar: recipe.nutritionalInfo.sugar,
      };
    }

    /**
     * Conditionally include dietaryFlags only if present.
     * Extracts raw boolean values from the DietaryFlags value object
     * to avoid storing class instances in MongoDB.
     */
    if (recipe.dietaryFlags) {
      mongoDoc.dietaryFlags = {
        vegetarian: recipe.dietaryFlags.vegetarian,
        vegan: recipe.dietaryFlags.vegan,
        halal: recipe.dietaryFlags.halal,
        glutenFree: recipe.dietaryFlags.glutenFree,
        dairyFree: recipe.dietaryFlags.dairyFree,
        nutFree: recipe.dietaryFlags.nutFree,
      };
    }

    return mongoDoc;
  }

  /**
   * Converts an array of raw MongoDB documents into Recipe domain entities
   *
   * A convenience method that delegates to toDomain() for each document,
   * providing a clean way to map query results that return multiple documents.
   *
   * @static
   * @param {Array<Object>} mongoDocs - Array of raw MongoDB documents to convert
   * @returns {Array<Recipe>} Array of fully reconstructed Recipe domain entities
   *
   * @example
   * const mongoResults = await RecipeModel.find({ isActive: true });
   * const domainRecipes = RecipeMapper.toDomainList(mongoResults);
   * domainRecipes.forEach(recipe => console.log(recipe.name));
   */
  static toDomainList(mongoDocs) {
    // Delegate each document's conversion to the toDomain method
    return mongoDocs.map((doc) => this.toDomain(doc));
  }
}

module.exports = RecipeMapper;

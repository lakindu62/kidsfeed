/**
 * RecipeNotFoundException
 *
 * Custom exception class for handling cases where a requested recipe cannot be found.
 * Thrown when attempting to retrieve, update, or delete a recipe that doesn't exist
 * in the system.
 *
 * This exception automatically constructs a meaningful error message including the
 * recipe ID and sets the appropriate HTTP status code for REST API responses.
 *
 * @class RecipeNotFoundException
 * @extends Error
 *
 * @example
 * throw new RecipeNotFoundException('recipe-123');
 * // Error message: "Recipe with ID 'recipe-123' not found"
 */
class RecipeNotFoundException extends Error {
  /**
   * Creates a new RecipeNotFoundException
   *
   * @constructor
   * @param {string} recipeId - The ID of the recipe that was not found
   *
   * @property {string} name - Exception name identifier ('RecipeNotFoundException')
   * @property {number} statusCode - HTTP status code (404 Not Found)
   * @property {string} recipeId - The ID of the missing recipe (useful for logging and debugging)
   * @property {string} message - Auto-generated error message inherited from Error class
   */
  constructor(recipeId) {
    // Call parent Error constructor with formatted message including the recipe ID
    super(`Recipe with ID '${recipeId}' not found`);

    // Set the exception name for easier identification in logs and error handling
    this.name = 'RecipeNotFoundException';

    // Set HTTP status code for API error responses (404 = Not Found)
    this.statusCode = 404;

    // Store the recipe ID for potential use in error handling, logging, or analytics
    this.recipeId = recipeId;
  }
}

export default RecipeNotFoundException;

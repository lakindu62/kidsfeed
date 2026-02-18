/**
 * InvalidRecipeException
 *
 * Custom exception class for handling invalid recipe data or validation errors.
 * Thrown when a recipe fails validation rules or contains invalid data.
 *
 * This exception is typically used in the domain layer when business rules
 * are violated, such as missing required fields, invalid values, or
 * constraint violations.
 *
 * @class InvalidRecipeException
 * @extends Error
 *
 * @example
 * throw new InvalidRecipeException('Recipe name cannot be empty');
 */
class InvalidRecipeException extends Error {
  /**
   * Creates a new InvalidRecipeException
   *
   * @constructor
   * @param {string} message - Descriptive error message explaining the validation failure
   *
   * @property {string} name - Exception name identifier ('InvalidRecipeException')
   * @property {number} statusCode - HTTP status code (400 Bad Request)
   * @property {string} message - Error message inherited from Error class
   */
  constructor(message) {
    // Call parent Error constructor with the message
    super(message);

    // Set the exception name for easier identification in logs and error handling
    this.name = 'InvalidRecipeException';

    // Set HTTP status code for API error responses (400 = Bad Request)
    this.statusCode = 400;
  }
}

module.exports = InvalidRecipeException;

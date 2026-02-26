// Thrown when a recipe fails validation or contains invalid data
class InvalidRecipeException extends Error {
  // @param {string} message - Validation failure description
  constructor(message) {
    super(message);
    this.name = 'InvalidRecipeException';
    this.statusCode = 400;
  }
}

export default InvalidRecipeException;

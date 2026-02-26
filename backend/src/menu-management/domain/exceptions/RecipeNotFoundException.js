// Thrown when a requested recipe cannot be found
class RecipeNotFoundException extends Error {
  // @param {string} recipeId - The ID of the recipe that was not found
  constructor(recipeId) {
    super(`Recipe with ID '${recipeId}' not found`);
    this.name = 'RecipeNotFoundException';
    this.statusCode = 404;
    this.recipeId = recipeId;
  }
}

export default RecipeNotFoundException;

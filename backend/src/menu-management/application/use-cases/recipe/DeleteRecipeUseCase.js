import RecipeNotFoundException from '../../../domain/exceptions/RecipeNotFoundException.js';

// Soft deletes a recipe by ID; throws RecipeNotFoundException if not found
class DeleteRecipeUseCase {
  /**
   * @param {IRecipeRepository} recipeRepository
   */
  constructor(recipeRepository) {
    this.recipeRepository = recipeRepository;
  }

  /**
   * @param {string} recipeId
   * @returns {Promise<Recipe>}
   * @throws {RecipeNotFoundException}
   */
  async execute(recipeId) {
    const recipe = await this.recipeRepository.delete(recipeId);

    if (!recipe) {
      throw new RecipeNotFoundException(recipeId);
    }

    return recipe;
  }
}

export default DeleteRecipeUseCase;

import RecipeNotFoundException from '../../../domain/exceptions/RecipeNotFoundException.js';

// Retrieves a single recipe by ID; throws RecipeNotFoundException if not found
class GetRecipeUseCase {
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
    const recipe = await this.recipeRepository.findById(recipeId);

    if (!recipe) {
      throw new RecipeNotFoundException(recipeId);
    }

    return recipe;
  }
}

export default GetRecipeUseCase;

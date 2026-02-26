// Provides ingredient and dietary flag search over active recipes
class SearchRecipeUseCase {
  /**
   * @param {IRecipeRepository} recipeRepository
   */
  constructor(recipeRepository) {
    this.recipeRepository = recipeRepository;
  }

  /**
   * @param {string} ingredientName
   * @returns {Promise<Array<Recipe>>}
   * @throws {Error} If ingredientName is empty or whitespace
   */
  async searchByIngredient(ingredientName) {
    if (!ingredientName || ingredientName.trim().length === 0) {
      throw new Error('Ingredient name is required for search');
    }

    await this.recipeRepository.searchByIngredient(ingredientName.trim());
  }

  /**
   * @param {Object} flags
   * @returns {Promise<Array<Recipe>>}
   * @throws {Error} If no flags are provided
   */
  async searchDietaryFlags(flags) {
    if (!flags || Object.keys(flags).length === 0) {
      throw new Error('At least one dietary flag is required for search');
    }

    return await this.recipeRepository.findByDietaryFlags(flags);
  }
}

export default SearchRecipeUseCase;

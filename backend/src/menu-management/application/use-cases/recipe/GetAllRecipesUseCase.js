// Retrieves a paginated, filtered list of active recipes
class GetAllRecipesUseCase {
  /**
   * @param {IRecipeRepository} recipeRepository
   */
  constructor(recipeRepository) {
    this.recipeRepository = recipeRepository;
  }

  /**
   * @param {Object} [filters={}]
   * @param {Object} [pagination={page:1,limit:10}]
   * @returns {Promise<Object>}
   * @throws {Error}
   */
  async execute(filters = {}, pagination = { page: 1, limit: 10 }) {
    return await this.recipeRepository.findAll(filters, pagination);
  }
}

export default GetAllRecipesUseCase;

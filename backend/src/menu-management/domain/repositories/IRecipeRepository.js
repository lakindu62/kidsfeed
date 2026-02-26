// Abstract repository interface defining the contract for recipe data access
class IRecipeRepository {
  /**
   * @param {Recipe} _recipe
   * @returns {Promise<Recipe>}
   */
  async save(_recipe) {
    throw new Error('IRecipeRepository.save() must be implemented');
  }

  /**
   * @param {string} _id
   * @returns {Promise<Recipe|null>}
   */
  async findById(_id) {
    throw new Error('IRecipeRepository.findById() must be implemented');
  }

  /**
   * @param {Object} _filters
   * @param {Object} _pagination
   * @returns {Promise<Object>}
   */
  async findAll(_filters, _pagination) {
    throw new Error('IRecipeRepository.findAll() must be implemented');
  }

  /**
   * @param {string} _id
   * @param {Partial<Recipe>} _recipe
   * @returns {Promise<Recipe>}
   */
  async update(_id, _recipe) {
    throw new Error('IRecipeRepository.update() must be implemented');
  }

  /**
   * @param {string} _ingredientName
   * @returns {Promise<Array<Recipe>>}
   */
  async searchByIngredient(_ingredientName) {
    throw new Error(
      'IRecipeRepository.searchByIngredient() must be implemented'
    );
  }

  /**
   * @param {Object} _flags
   * @returns {Promise<Array<Recipe>>}
   */
  async findByDietaryFlags(_flags) {
    throw new Error(
      'IRecipeRepository.findByDietaryFlags() must be implemented'
    );
  }
}

export default IRecipeRepository;

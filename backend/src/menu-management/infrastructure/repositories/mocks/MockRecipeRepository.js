import IRecipeRepository from '../../../domain/repositories/IRecipeRepository.js';

// In-memory IRecipeRepository implementation for testing; data resets on clear()
class MockRecipeRepository extends IRecipeRepository {
  constructor() {
    super();
    this.recipes = [];
    this.nextId = 1;
  }

  /**
   * @param {Recipe} recipe
   * @returns {Promise<Object>}
   */
  async save(recipe) {
    const saved = { ...recipe, id: String(this.nextId++) };
    this.recipes.push(saved);
    return saved;
  }

  /**
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return this.recipes.find((r) => r.id === id) || null;
  }

  /**
   * @param {Object} [filters={}]
   * @param {Object} [pagination={}]
   * @returns {Promise<Object>}
   */
  async findAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;

    let filtered = this.recipes.filter((r) => r.isActive !== false);

    if (filters.vegetarian)
      {filtered = filtered.filter((r) => r.dietaryFlags?.vegetarian);}
    if (filters.halal) {filtered = filtered.filter((r) => r.dietaryFlags?.halal);}
    if (filters.vegan) {filtered = filtered.filter((r) => r.dietaryFlags?.vegan);}

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      recipes: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * @param {string} id
   * @param {Partial<Recipe>} recipe
   * @returns {Promise<Object|null>}
   */
  async update(id, recipe) {
    const index = this.recipes.findIndex((r) => r.id === id);
    if (index === -1) {return null;}

    this.recipes[index] = { ...this.recipes[index], ...recipe, id };
    return this.recipes[index];
  }

  // Soft deletes by setting isActive to false
  /**
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async delete(id) {
    const index = this.recipes.findIndex((r) => r.id === id);
    if (index === -1) {return null;}

    this.recipes[index].isActive = false;
    return this.recipes[index];
  }

  // Case-insensitive partial match on ingredient name
  /**
   * @param {string} ingredientName
   * @returns {Promise<Array<Object>>}
   */
  async searchByIngredient(ingredientName) {
    return this.recipes.filter(
      (r) =>
        r.isActive !== false &&
        r.ingredients?.some((ing) =>
          ing.name.toLowerCase().includes(ingredientName.toLowerCase())
        )
    );
  }

  /**
   * @param {Object} flags
   * @returns {Promise<Array<Object>>}
   */
  async findByDietaryFlags(flags) {
    return this.recipes.filter((r) => {
      if (r.isActive === false) {return false;}
      return Object.keys(flags).every(
        (flag) => !flags[flag] || r.dietaryFlags?.[flag] === true
      );
    });
  }

  // Resets storage and ID counter; use between tests
  clear() {
    this.recipes = [];
    this.nextId = 1;
  }

  // Returns total recipe count including inactive
  /** @returns {number} */
  count() {
    return this.recipes.length;
  }
}

export default MockRecipeRepository;

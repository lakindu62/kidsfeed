// Represents a recipe with ingredients, instructions, nutritional info, and dietary flags
class Recipe {
  /**
   * @param {Object} params - Recipe configuration object
   * @param {string|null} [params.id=null]
   * @param {string} params.name
   * @param {string} params.description
   * @param {Array<Object>} params.ingredients
   * @param {string} params.instructions
   * @param {Object|null} [params.nutritionalInfo=null]
   * @param {Object} params.dietaryFlags
   * @param {Array<string>} [params.allergens=[]]
   * @param {number} params.servingSize
   * @param {number} params.prepTime
   * @param {Array<string>} [params.seasonal=[]]
   * @param {boolean} [params.isActive=true]
   * @param {Date} [params.createdAt=new Date()]
   * @param {Date} [params.updatedAt=new Date()]
   */
  constructor({
    id = null,
    name,
    description,
    ingredients,
    instructions,
    nutritionalInfo = null,
    dietaryFlags,
    allergens = [],
    servingSize,
    prepTime,
    seasonal = [],
    isActive = true,
    createdBy = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.ingredients = ingredients;
    this.instructions = instructions;
    this.nutritionalInfo = nutritionalInfo;
    this.dietaryFlags = dietaryFlags;
    this.allergens = allergens;
    this.servingSize = servingSize;
    this.prepTime = prepTime;
    this.seasonal = seasonal;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Validates required fields; throws if invalid
  /**
   * @returns {boolean}
   * @throws {Error}
   */
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Recipe name is required');
    }
    if (!this.ingredients || this.ingredients.length === 0) {
      throw new Error('Recipe must have at least one ingredient');
    }
    if (!this.instructions || this.instructions.trim().length === 0) {
      throw new Error('Instructions are required');
    }
    if (this.servingSize <= 0) {
      throw new Error('Serving size must be greater than 0');
    }
    return true;
  }

  // Updates nutritional info and timestamp
  updateNutrition(nutritionalInfo) {
    this.nutritionalInfo = nutritionalInfo;
    this.updatedAt = new Date();
  }

  /** @returns {boolean} */
  isVegetarian() {
    return this.dietaryFlags.vegetarian === true;
  }

  /** @returns {boolean} */
  isHalal() {
    return this.dietaryFlags.halal === true;
  }

  /**
   * @param {string} allergen
   * @returns {boolean}
   */
  hasAllergens(allergen) {
    return this.allergens.includes(allergen);
  }

  // Deactivates the recipe and updates timestamp
  markAsInactive() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Scales ingredient quantities proportionally to the new serving size
  /**
   * @param {number} newServingSize
   * @throws {Error}
   */
  adjustServingSize(newServingSize) {
    const multiplier = newServingSize / this.servingSize;
    this.ingredients = this.ingredients.map((ingredient) => ({
      ...ingredient,
      quantity: ingredient.quantity * multiplier,
    }));
    this.servingSize = newServingSize;
    this.updatedAt = new Date();
  }
}

export default Recipe;

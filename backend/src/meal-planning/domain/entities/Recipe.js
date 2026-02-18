/**
 * Recipe Class
 *
 * Represents a recipe with complete details including ingredients, instructions,
 * nutritional information, and dietary flags. Provides methods for validation,
 * serving size adjustment, and recipe management.
 *
 * @class Recipe
 */
class Recipe {
  /**
   * Creates a new Recipe instance
   *
   * @constructor
   * @param {Object} params - Recipe configuration object
   * @param {string|null} [params.id=null] - Unique identifier for the recipe
   * @param {string} params.name - Name of the recipe
   * @param {string} params.description - Detailed description of the recipe
   * @param {Array<Object>} params.ingredients - List of ingredients with quantities
   * @param {string} params.instructions - Step-by-step cooking instructions
   * @param {Object|null} [params.nutritionalInfo=null] - Nutritional information per serving
   * @param {Object} params.dietaryFlags - Dietary classification flags (vegetarian, halal, etc.)
   * @param {Array<string>} [params.allergens=[]] - List of allergens present in the recipe
   * @param {number} params.servingSize - Number of servings this recipe makes
   * @param {number} params.prepTime - Preparation time in minutes
   * @param {Array<string>} [params.seasonal=[]] - Seasonal availability indicators
   * @param {boolean} [params.isActive=true] - Whether the recipe is currently active
   * @param {Date} [params.createdAt=new Date()] - Recipe creation timestamp
   * @param {Date} [params.updatedAt=new Date()] - Last update timestamp
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
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Validates the recipe data to ensure all required fields are present and valid
   *
   * @returns {boolean} True if validation passes
   * @throws {Error} If any validation rule fails
   */
  validate() {
    // Check if recipe name exists and is not empty after trimming whitespace
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Recipe name is required');
    }

    // Ensure at least one ingredient is provided
    if (!this.ingredients || this.ingredients.length === 0) {
      throw new Error('Recipe must have at least one ingredient');
    }

    // Verify that instructions are provided and not empty
    if (!this.instructions || this.instructions.trim().length === 0) {
      throw new Error('Instructions are required');
    }

    // Validate that serving size is a positive number
    if (this.servingSize <= 0) {
      throw new Error('Serving size must be greater than 0');
    }

    return true;
  }

  /**
   * Updates the nutritional information for the recipe
   * Also updates the last modified timestamp
   *
   * @param {Object} nutritionalInfo - New nutritional information object
   */
  updateNutrition(nutritionalInfo) {
    this.nutritionalInfo = nutritionalInfo;
    this.updatedAt = new Date();
  }

  /**
   * Checks if the recipe is vegetarian
   *
   * @returns {boolean} True if the recipe is vegetarian, false otherwise
   */
  isVegetarian() {
    return this.dietaryFlags.vegetarian === true;
  }

  /**
   * Checks if the recipe is halal
   *
   * @returns {boolean} True if the recipe is halal, false otherwise
   * @note There's a typo in the property name: 'hala' should likely be 'halal'
   */
  isHalal() {
    return this.dietaryFlags.hala === true; // TODO: Fix typo - should be 'halal'
  }

  /**
   * Checks if the recipe contains a specific allergen
   *
   * @param {string} allergen - The allergen to check for
   * @returns {boolean} True if the allergen is present in the recipe
   */
  hasAllergens(allergen) {
    return this.allergens.includes(allergen);
  }

  /**
   * Marks the recipe as inactive
   * Updates the last modified timestamp
   * Inactive recipes can be filtered out from active recipe lists
   */
  markAsInactive() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Adjusts ingredient quantities based on a new serving size
   * Calculates a multiplier and scales all ingredient quantities proportionally
   *
   * @param {number} newServingSize - The desired new serving size
   * @throws {Error} If newServingSize is 0 or negative (would cause division by zero or invalid quantities)
   */
  adjustServingSize(newServingSize) {
    // Calculate the scaling factor based on the ratio of new to current serving size
    const multiplier = newServingSize / this.servingSize;

    // Scale each ingredient quantity proportionally
    this.ingredients = this.ingredients.map((ingredient) => ({
      ...ingredient,
      quantity: ingredient.quantity * multiplier,
    }));

    // Update the serving size and timestamp
    this.servingSize = newServingSize;
    this.updatedAt = new Date();
  }
}

export default Recipe;

// DTO for validating and mapping the create recipe HTTP request body
class CreateRecipeRequest {
  /**
   * @param {Object} body
   * @param {string} body.name
   * @param {Array<Object>} body.ingredients
   * @param {string} body.instructions
   * @param {number} body.servingSize
   * @param {string} body.createdBy
   * @param {string} [body.description='']
   * @param {Object} [body.dietaryFlags]
   * @param {Array<string>} [body.allergens=[]]
   * @param {number} [body.prepTime=30]
   * @param {Array<string>} [body.seasonal=[]]
   */
  constructor(body) {
    this.name = body.name;
    this.ingredients = body.ingredients;
    this.instructions = body.instructions;
    this.servingSize = body.servingSize;
    this.createdBy = body.createdBy;
    this.description = body.description || '';
    this.dietaryFlags = body.dietaryFlags || {
      vegetarian: false,
      vegan: false,
      halal: false,
      glutenFree: false,
      dairyFree: false,
      nutFree: false,
    };
    this.allergens = body.allergens || [];
    this.prepTime = body.prepTime || 30;
    this.seasonal = body.seasonal || [];
  }

  // Accumulates and returns all validation errors; empty array means valid
  /** @returns {Array<string>} */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Recipe name is required');
    }

    if (!this.ingredients || this.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    } else {
      this.ingredients.forEach((ing, index) => {
        if (!ing.name) {errors.push(`Ingredient ${index + 1}: name is required`);}
        if (!ing.quantity || ing.quantity <= 0)
          {errors.push(`Ingredient ${index + 1}: valid quantity is required`);}
        if (!ing.unit) {errors.push(`Ingredient ${index + 1}: unit is required`);}
      });
    }

    if (!this.instructions || this.instructions.trim().length === 0) {
      errors.push('Instructions are required');
    }

    if (!this.servingSize || this.servingSize <= 0) {
      errors.push('Serving size must be greater than 0');
    }

    return errors;
  }
}

export default CreateRecipeRequest;

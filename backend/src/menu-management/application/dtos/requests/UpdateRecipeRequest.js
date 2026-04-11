// DTO for partial recipe updates; only maps and validates fields explicitly provided
class UpdateRecipeRequest {
  /**
   * @param {Object} body
   * @param {string} [body.name]
   * @param {string} [body.description]
   * @param {Array<Object>} [body.ingredients]
   * @param {string} [body.instructions]
   * @param {Object} [body.dietaryFlags]
   * @param {Array<string>} [body.allergens]
   * @param {number} [body.servingSize]
   * @param {number} [body.prepTime]
   * @param {Array<string>} [body.seasonal]
   */
  constructor(body) {
    if (body.name !== undefined) {
      this.name = body.name;
    }
    if (body.description !== undefined) {
      this.description = body.description;
    }
    if (body.imageUrl !== undefined) {
      this.imageUrl = body.imageUrl;
    }
    if (body.ingredients !== undefined) {
      this.ingredients = body.ingredients;
    }
    if (body.instructions !== undefined) {
      this.instructions = body.instructions;
    }
    if (body.dietaryFlags !== undefined) {
      this.dietaryFlags = body.dietaryFlags;
    }
    if (body.allergens !== undefined) {
      this.allergens = body.allergens;
    }
    if (body.servingSize !== undefined) {
      this.servingSize = body.servingSize;
    }
    if (body.prepTime !== undefined) {
      this.prepTime = body.prepTime;
    }
    if (body.seasonal !== undefined) {
      this.seasonal = body.seasonal;
    }
    if (body.nutritionalInfo !== undefined) {
      this.nutritionalInfo = body.nutritionalInfo;
    }
  }

  // Validates only provided fields; accumulates all errors
  /** @returns {Array<string>} */
  validate() {
    const errors = [];

    if (this.name !== undefined && this.name.trim().length === 0) {
      errors.push('Recipe name cannot be empty');
    }

    if (this.imageUrl !== undefined && typeof this.imageUrl !== 'string') {
      errors.push('Image URL must be a string');
    }

    if (this.ingredients !== undefined) {
      if (this.ingredients.length === 0) {
        errors.push('At least one ingredient is required');
      } else {
        this.ingredients.forEach((ing, index) => {
          if (!ing.name) {
            errors.push(`Ingredient ${index + 1}: name is required`);
          }
          if (!ing.quantity || ing.quantity <= 0) {
            errors.push(`Ingredient ${index + 1}: valid quantity is required`);
          }
          if (!ing.unit) {
            errors.push(`Ingredient ${index + 1}: unit is required`);
          }
        });
      }
    }

    if (
      this.instructions !== undefined &&
      this.instructions.trim().length === 0
    ) {
      errors.push('Instructions cannot be empty');
    }

    if (this.servingSize !== undefined && this.servingSize <= 0) {
      errors.push('Serving size must be greater than 0');
    }

    return errors;
  }
}

export default UpdateRecipeRequest;

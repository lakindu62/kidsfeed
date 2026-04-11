// DTO that transforms a Recipe domain entity into a client-facing JSON response
class RecipeResponse {
  /**
   * @param {Recipe} recipe
   */
  constructor(recipe) {
    this.id = recipe.id;
    this.name = recipe.name;
    this.description = recipe.description;
    this.imageUrl = recipe.imageUrl || '';
    this.ingredients = recipe.ingredients;
    this.instructions = recipe.instructions;
    this.servingSize = recipe.servingSize;
    this.prepTime = recipe.prepTime;
    this.seasonal = recipe.seasonal;
    this.allergens = recipe.allergens;

    // Unwrap value objects into plain objects for serialization
    this.dietaryFlags = recipe.dietaryFlags
      ? {
          vegetarian: recipe.dietaryFlags.vegetarian,
          vegan: recipe.dietaryFlags.vegan,
          halal: recipe.dietaryFlags.halal,
          glutenFree: recipe.dietaryFlags.glutenFree,
          dairyFree: recipe.dietaryFlags.dairyFree,
          nutFree: recipe.dietaryFlags.nutFree,
        }
      : null;

    this.nutritionalInfo = recipe.nutritionalInfo
      ? {
          calories: recipe.nutritionalInfo.calories,
          protein: recipe.nutritionalInfo.protein,
          carbs: recipe.nutritionalInfo.carbs,
          fats: recipe.nutritionalInfo.fats,
          fiber: recipe.nutritionalInfo.fiber,
          sugar: recipe.nutritionalInfo.sugar,
        }
      : null;

    this.createdAt = recipe.createdAt;
    this.updatedAt = recipe.updatedAt;
  }

  /** @returns {Object} */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      ingredients: this.ingredients,
      instructions: this.instructions,
      servingSize: this.servingSize,
      prepTime: this.prepTime,
      seasonal: this.seasonal,
      allergens: this.allergens,
      dietaryFlags: this.dietaryFlags,
      nutritionalInfo: this.nutritionalInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default RecipeResponse;

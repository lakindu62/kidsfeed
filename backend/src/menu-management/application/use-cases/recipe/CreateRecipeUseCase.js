import Recipe from '../../../domain/entities/Recipe.js';
import DietaryFlags from '../../../domain/value-objects/DietaryFlags.js';

// Orchestrates recipe creation: validates, and persists a new Recipe entity
class CreateRecipeUseCase {
  /**
   * @param {IRecipeRepository} recipeRepository
   */
  constructor(recipeRepository) {
    this.recipeRepository = recipeRepository;
  }

  /**
   * @param {Object} recipeData
   * @returns {Promise<Recipe>}
   * @throws {Error} If validation or repository save fails
   */
  async execute(recipeData) {
    const recipe = new Recipe({
      name: recipeData.name,
      description: recipeData.description,
      imageUrl: recipeData.imageUrl,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      nutritionalInfo: recipeData.nutritionalInfo || null,
      dietaryFlags: new DietaryFlags(recipeData.dietaryFlags || {}),
      allergens: recipeData.allergens || [],
      seasonal: recipeData.seasonal || [],
      servingSize: recipeData.servingSize,
      prepTime: recipeData.prepTime,
      createdBy: recipeData.createdBy,
    });

    recipe.validate();

    return await this.recipeRepository.save(recipe);
  }
}

export default CreateRecipeUseCase;

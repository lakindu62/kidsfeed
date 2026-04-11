import Recipe from '../../../domain/entities/Recipe.js';
import DietaryFlags from '../../../domain/value-objects/DietaryFlags.js';
import RecipeNotFoundException from '../../../domain/exceptions/RecipeNotFoundException.js';

// Merges partial update data with existing recipe, validates, and persists
class UpdateRecipeUseCase {
  /**
   * @param {IRecipeRepository} recipeRepository
   */
  constructor(recipeRepository) {
    this.recipeRepository = recipeRepository;
  }

  /**
   * @param {string} recipeId
   * @param {Object} updateData
   * @returns {Promise<Recipe>}
   * @throws {RecipeNotFoundException}
   * @throws {Error} If validation or repository update fails
   */
  async execute(recipeId, updateData) {
    const existingRecipe = await this.recipeRepository.findById(recipeId);

    if (!existingRecipe) {
      throw new RecipeNotFoundException(recipeId);
    }

    const updatedRecipe = new Recipe({
      id: recipeId,
      name: updateData.name ?? existingRecipe.name,
      description: updateData.description ?? existingRecipe.description,
      imageUrl: updateData.imageUrl ?? existingRecipe.imageUrl,
      ingredients: updateData.ingredients ?? existingRecipe.ingredients,
      instructions: updateData.instructions ?? existingRecipe.instructions,
      dietaryFlags: updateData.dietaryFlags
        ? new DietaryFlags(updateData.dietaryFlags)
        : existingRecipe.dietaryFlags,
      allergens: updateData.allergens ?? existingRecipe.allergens,
      prepTime: updateData.prepTime ?? existingRecipe.prepTime,
      servingSize: updateData.servingSize ?? existingRecipe.servingSize,
      seasonal: updateData.seasonal ?? existingRecipe.seasonal,
      nutritionalInfo: existingRecipe.nutritionalInfo,
      isActive: existingRecipe.isActive,
      createdAt: existingRecipe.createdAt,
      updatedAt: new Date(),
    });

    updatedRecipe.validate();

    return await this.recipeRepository.update(recipeId, updatedRecipe);
  }
}

export default UpdateRecipeUseCase;

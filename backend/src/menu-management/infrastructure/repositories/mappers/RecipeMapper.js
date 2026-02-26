import Recipe from '../../../domain/entities/Recipe.js';
import NutritionalInfo from '../../../domain/value-objects/NutritionalInfo.js';
import DietaryFlags from '../../../domain/value-objects/DietaryFlags.js';

// Maps Recipe data between the domain layer and MongoDB persistence layer
class RecipeMapper {
  // Converts a MongoDB document to a Recipe domain entity
  /**
   * @param {Object|null} mongoDoc
   * @returns {Recipe|null}
   */
  static toDomain(mongoDoc) {
    if (!mongoDoc) {
      return null;
    }

    return new Recipe({
      id: mongoDoc._id.toString(),
      name: mongoDoc.name,
      description: mongoDoc.description,
      instructions: mongoDoc.instructions,
      ingredients: mongoDoc.ingredients,
      allergens: mongoDoc.allergens || [],
      servingSize: mongoDoc.servingSize,
      prepTime: mongoDoc.prepTime,
      seasonal: mongoDoc.seasonal || [],
      isActive: mongoDoc.isActive,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
      nutritionalInfo: mongoDoc.nutritionalInfo
        ? new NutritionalInfo({
            calories: mongoDoc.nutritionalInfo.calories,
            protein: mongoDoc.nutritionalInfo.protein,
            carbs: mongoDoc.nutritionalInfo.carbs,
            fats: mongoDoc.nutritionalInfo.fats,
            fiber: mongoDoc.nutritionalInfo.fiber,
            sugar: mongoDoc.nutritionalInfo.sugar,
          })
        : null,
      dietaryFlags: new DietaryFlags({
        vegetarian: mongoDoc.dietaryFlags?.vegetarian || false,
        vegan: mongoDoc.dietaryFlags?.vegan || false,
        halal: mongoDoc.dietaryFlags?.halal || false,
        glutenFree: mongoDoc.dietaryFlags?.glutenFree || false,
        dairyFree: mongoDoc.dietaryFlags?.dairyFree || false,
        nutFree: mongoDoc.dietaryFlags?.nutFree || false,
      }),
    });
  }

  // Converts a Recipe domain entity to a plain MongoDB-compatible document
  /**
   * @param {Recipe} recipe
   * @returns {Object}
   */
  static toPersistence(recipe) {
    const mongoDoc = {
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      allergens: recipe.allergens || [],
      servingSize: recipe.servingSize,
      prepTime: recipe.prepTime,
      seasonal: recipe.seasonal || [],
      isActive: recipe.isActive,
    };

    if (recipe.nutritionalInfo) {
      mongoDoc.nutritionalInfo = {
        calories: recipe.nutritionalInfo.calories,
        protein: recipe.nutritionalInfo.protein,
        carbs: recipe.nutritionalInfo.carbs,
        fats: recipe.nutritionalInfo.fats,
        fiber: recipe.nutritionalInfo.fiber,
        sugar: recipe.nutritionalInfo.sugar,
      };
    }

    if (recipe.dietaryFlags) {
      mongoDoc.dietaryFlags = {
        vegetarian: recipe.dietaryFlags.vegetarian,
        vegan: recipe.dietaryFlags.vegan,
        halal: recipe.dietaryFlags.halal,
        glutenFree: recipe.dietaryFlags.glutenFree,
        dairyFree: recipe.dietaryFlags.dairyFree,
        nutFree: recipe.dietaryFlags.nutFree,
      };
    }

    return mongoDoc;
  }

  // Maps an array of MongoDB documents to Recipe domain entities
  /**
   * @param {Array<Object>} mongoDocs
   * @returns {Array<Recipe>}
   */
  static toDomainList(mongoDocs) {
    return mongoDocs.map((doc) => this.toDomain(doc));
  }
}

export default RecipeMapper;

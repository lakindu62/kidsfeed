/**
 * CreateRecipeUseCase
 *
 * Application service responsible for orchestrating the creation of new recipes.
 * This use case implements the Command pattern from Clean Architecture, encapsulating
 * the business logic for recipe creation in a single, testable operation.
 *
 * Responsibilities:
 * 1. Construct a valid Recipe domain entity from input data
 * 2. Validate the recipe according to business rules
 * 3. Optionally calculate nutritional information via an external service
 * 4. Persist the recipe using the repository
 *
 * This use case is independent of the delivery mechanism (REST API, GraphQL, CLI),
 * making it reusable across different interfaces and easy to test in isolation.
 *
 * @class CreateRecipeUseCase
 * @module menu-management/application/use-cases/recipe/CreateRecipeUseCase
 *
 * @example
 * const useCase = new CreateRecipeUseCase(recipeRepository, nutritionService);
 * const savedRecipe = await useCase.execute({
 *   name: 'Chicken Pasta',
 *   ingredients: [...],
 *   servingSize: 4,
 *   ...
 * });
 */
import Recipe from '../../../domain/entities/Recipe';
import DietaryFlags from '../../../domain/value-objects/DietaryFlags';

class CreateRecipeUseCase {
  /**
   * Initializes the use case with required dependencies
   *
   * @constructor
   * @param {IRecipeRepository} recipeRepository - Repository for persisting recipes
   * @param {Object|null} [nutritionService=null] - Optional service for calculating nutritional info
   *
   * @example
   * // With nutrition service
   * const useCase = new CreateRecipeUseCase(mongoRepo, nutritionAPI);
   *
   * // Without nutrition service (nutrition will be skipped)
   * const useCase = new CreateRecipeUseCase(mongoRepo);
   */
  constructor(recipeRepository, nutritionService = null) {
    /**
     * Repository instance for persisting recipes
     * @type {IRecipeRepository}
     * @private
     */
    this.recipeRepository = recipeRepository;

    /**
     * Optional nutrition calculation service
     * When null, nutritional information will not be calculated automatically
     * @type {Object|null}
     * @private
     */
    this.nutritionService = nutritionService;
  }

  /**
   * Executes the recipe creation workflow
   *
   * Orchestrates the following steps:
   * 1. Constructs a Recipe domain entity from the input data
   * 2. Validates the recipe according to domain business rules
   * 3. Optionally calculates and attaches nutritional information
   * 4. Persists the recipe via the repository
   * 5. Returns the saved recipe with generated ID and timestamps
   *
   * @async
   * @param {Object} recipeData - Raw recipe data from the client
   * @param {string} recipeData.name - Recipe name (required)
   * @param {string} recipeData.description - Recipe description
   * @param {Array<Object>} recipeData.ingredients - List of ingredients with quantities (required)
   * @param {string} recipeData.instructions - Step-by-step cooking instructions (required)
   * @param {Object} [recipeData.dietaryFlags={}] - Dietary classification flags
   * @param {Array<string>} [recipeData.allergens=[]] - List of allergens present
   * @param {number} recipeData.servingSize - Number of servings (required)
   * @param {number} recipeData.prepTime - Preparation time in minutes
   * @param {Array<string>} [recipeData.seasonal=[]] - Seasonal availability tags
   * @returns {Promise<Recipe>} The saved Recipe entity with ID and timestamps
   * @throws {Error} If recipe validation fails (e.g., missing required fields)
   * @throws {Error} If repository save operation fails
   *
   * @example
   * const savedRecipe = await createRecipeUseCase.execute({
   *   name: 'Spaghetti Carbonara',
   *   description: 'Classic Italian pasta dish',
   *   ingredients: [
   *     { name: 'spaghetti', quantity: 400, unit: 'g' },
   *     { name: 'eggs', quantity: 4, unit: 'piece' }
   *   ],
   *   instructions: 'Boil pasta. Mix eggs and cheese...',
   *   servingSize: 4,
   *   prepTime: 25,
   *   dietaryFlags: { vegetarian: true },
   *   allergens: ['eggs', 'dairy', 'gluten']
   * });
   *
   * @todo Fix syntax error: 'this/this.nutritionService' should be 'this.nutritionService'
   * @todo Fix typo: 'ingredients.ingredients' should be 'recipe.ingredients'
   */
  async execute(recipeData) {
    // Construct the Recipe domain entity from the input data
    // This ensures all business rules and invariants are enforced
    const recipe = new Recipe({
      name: recipeData.name,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,

      // Wrap dietary flags in the DietaryFlags value object
      // Defaults to an empty object if not provided (all flags will be false)
      dietaryFlags: new DietaryFlags(recipeData.dietaryFlags || {}),

      // Default to empty arrays if not provided
      allergens: recipeData.allergens || [],
      seasonal: recipeData.seasonal || [],

      servingSize: recipeData.servingSize,
      prepTime: recipeData.prepTime,
    });

    // Validate the recipe according to domain business rules
    // Throws an Error if validation fails (e.g., missing name, no ingredients)
    recipe.validate();

    // Optionally calculate nutritional information if the service is available
    // BUG: Syntax error - 'this/this.nutritionService' should be 'this.nutritionService'
    // BUG: Reference error - 'ingredients.ingredients' should be 'recipe.ingredients'
    if (this / this.nutritionService && ingredients.ingredients.length > 0) {
      try {
        // Call the external nutrition service to calculate nutritional data
        const nutritionData = await this.nutritionService.calculate(
          recipe.ingredients
        );

        // Attach the calculated nutrition to the recipe entity
        recipe.updateNutrition(nutritionData);
      } catch (error) {
        // Log the error but don't fail the entire operation
        // Nutrition calculation is considered a non-critical enhancement
        console.warn('Nutrition calculation failed: ', error.message);
      }
    }

    // Persist the recipe using the repository
    // Returns the saved recipe with generated ID and timestamps
    const savedRecipe = await this.recipeRepository.save(recipe);

    return savedRecipe;
  }
}

export default CreateRecipeUseCase;

import CreateRecipeRequest from '../../application/dtos/requests/CreateRecipeRequest.js';
import UpdateRecipeRequest from '../../application/dtos/requests/UpdateRecipeRequest.js';
import RecipeResponse from '../../application/dtos/responses/RecipeResponse.js';

// HTTP controller for recipe endpoints; delegates to use cases and formats responses
class RecipeController {
  /**
   * @param {Object} dependencies
   * @param {CreateRecipeUseCase} dependencies.createRecipeUseCase
   * @param {GetRecipeUseCase} dependencies.getRecipeUseCase
   * @param {GetAllRecipesUseCase} dependencies.getAllRecipesUseCase
   * @param {UpdateRecipeUseCase} dependencies.updateRecipeUseCase
   * @param {DeleteRecipeUseCase} dependencies.deleteRecipeUseCase
   * @param {SearchRecipeUseCase} dependencies.searchRecipeUseCase
   */
  constructor({
    createRecipeUseCase,
    getRecipeUseCase,
    getAllRecipesUseCase,
    updateRecipeUseCase,
    deleteRecipeUseCase,
    searchRecipeUseCase,
  }) {
    this.createRecipeUseCase = createRecipeUseCase;
    this.getRecipeUseCase = getRecipeUseCase;
    this.getAllRecipesUseCase = getAllRecipesUseCase;
    this.updateRecipeUseCase = updateRecipeUseCase;
    this.deleteRecipeUseCase = deleteRecipeUseCase;
    this.searchRecipeUseCase = searchRecipeUseCase;
  }

  // POST /api/recipes
  async createRecipe(req, res, next) {
    try {
      const recipeRequest = new CreateRecipeRequest(req.body);
      const validationErrors = recipeRequest.validate();

      if (validationErrors.length > 0) {
        return res
          .status(400)
          .json({ success: false, errors: validationErrors });
      }

      const recipe = await this.createRecipeUseCase.execute(recipeRequest);

      res.status(201).json({
        success: true,
        message: 'Recipe created successfully',
        data: new RecipeResponse(recipe),
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/recipes/:id
  async getRecipe(req, res, next) {
    try {
      const { id } = req.params;
      const recipe = await this.getRecipeUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: new RecipeResponse(recipe),
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/recipes?page&limit&vegetarian&vegan&halal&glutenFree&dairyFree&nutFree
  async getAllRecipes(req, res, next) {
    try {
      const filters = {
        vegetarian: req.query.vegetarian === 'true',
        vegan: req.query.vegan === 'true',
        halal: req.query.halal === 'true',
        glutenFree: req.query.glutenFree === 'true',
        dairyFree: req.query.dairyFree === 'true',
        nutFree: req.query.nutFree === 'true',
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      if (pagination.page < 1) {
        return res
          .status(400)
          .json({ success: false, error: 'Page must be greater than 0' });
      }
      if (pagination.limit < 1 || pagination.limit > 100) {
        return res
          .status(400)
          .json({ success: false, error: 'Limit must be between 1 and 100' });
      }

      const result = await this.getAllRecipesUseCase.execute(
        filters,
        pagination
      );
      const recipes = result.recipes.map(
        (recipe) => new RecipeResponse(recipe)
      );

      res.status(200).json({
        success: true,
        data: recipes,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: pagination.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/recipes/:id
  async updateRecipe(req, res, next) {
    try {
      const { id } = req.params;
      const updateRequest = new UpdateRecipeRequest(req.body);
      const validationErrors = updateRequest.validate();

      if (validationErrors.length > 0) {
        return res
          .status(400)
          .json({ success: false, errors: validationErrors });
      }

      const recipe = await this.updateRecipeUseCase.execute(id, updateRequest);

      res.status(200).json({
        success: true,
        message: 'Recipe updated successfully',
        data: new RecipeResponse(recipe),
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/recipes/:id (soft delete)
  async deleteRecipe(req, res, next) {
    try {
      const { id } = req.params;
      await this.deleteRecipeUseCase.execute(id);

      res.status(200).json({
        success: true,
        message: 'Recipe deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/recipes/search/ingredient?name=
  async searchByIngredient(req, res, next) {
    try {
      const { name } = req.query;

      if (!name || name.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, error: 'Ingredient name is required' });
      }

      const recipes = await this.searchRecipeUseCase.searchByIngredient(name);
      const response = recipes.map((recipe) => new RecipeResponse(recipe));

      res
        .status(200)
        .json({ success: true, data: response, count: response.length });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/recipes/search/dietary?vegetarian&vegan&halal&glutenFree&dairyFree&nutFree
  async searchByDietaryFlags(req, res, next) {
    try {
      const flags = {
        vegetarian: req.query.vegetarian === 'true',
        vegan: req.query.vegan === 'true',
        halal: req.query.halal === 'true',
        glutenFree: req.query.glutenFree === 'true',
        dairyFree: req.query.dairyFree === 'true',
        nutFree: req.query.nutFree === 'true',
      };

      const hasFlags = Object.values(flags).some((flag) => flag === true);

      if (!hasFlags) {
        return res.status(400).json({
          success: false,
          error: 'At least one dietary flag must be set to true',
        });
      }

      const recipes =
        await this.searchRecipeUseCase.searchByDietaryFlags(flags);
      const response = recipes.map((recipe) => new RecipeResponse(recipe));

      res
        .status(200)
        .json({ success: true, data: response, count: response.length });
    } catch (error) {
      next(error);
    }
  }
}

export default RecipeController;

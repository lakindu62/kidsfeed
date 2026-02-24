import express from 'express';

// Repositories & Services
import MongoRecipeRepository from './infrastructure/repositories/MongoRecipeRepository.js';
import USDANutritionService from './infrastructure/services/USDANutritionService.js';

// Use Cases
import CreateRecipeUseCase from './application/use-cases/recipe/CreateRecipeUseCase.js';
import GetRecipeUseCase from './application/use-cases/recipe/GetRecipeUseCase.js';
import GetAllRecipesUseCase from './application/use-cases/recipe/GetAllRecipesUseCase.js';
import UpdateRecipeUseCase from './application/use-cases/recipe/UpdateRecipeUseCase.js';
import DeleteRecipeUseCase from './application/use-cases/recipe/DeleteRecipeUseCase.js';
import SearchRecipeUseCase from './application/use-cases/recipe/SearchRecipeUseCase.js';

// Controller
import RecipeController from './presentation/controllers/RecipeController.js';

// Instantiate infrastructure
const recipeRepository = new MongoRecipeRepository();
const nutritionService = new USDANutritionService();

// Instantiate Use Cases
const createRecipeUseCase = new CreateRecipeUseCase(recipeRepository, nutritionService);
const getRecipeUseCase = new GetRecipeUseCase(recipeRepository);
const getAllRecipesUseCase = new GetAllRecipesUseCase(recipeRepository);
const updateRecipeUseCase = new UpdateRecipeUseCase(recipeRepository, nutritionService);
const deleteRecipeUseCase = new DeleteRecipeUseCase(recipeRepository);
const searchRecipeUseCase = new SearchRecipeUseCase(recipeRepository);

// Instantiate Controller
const recipeController = new RecipeController({
  createRecipeUseCase,
  getRecipeUseCase,
  getAllRecipesUseCase,
  updateRecipeUseCase,
  deleteRecipeUseCase,
  searchRecipeUseCase
});

// Setup Router
export const recipeRouter = express.Router();

// Register routes
recipeRouter.post('/', recipeController.createRecipe.bind(recipeController));
recipeRouter.get('/', recipeController.getAllRecipes.bind(recipeController));
recipeRouter.get('/search/ingredient', recipeController.searchByIngredient.bind(recipeController));
recipeRouter.get('/search/dietary', recipeController.searchByDietaryFlags.bind(recipeController));
recipeRouter.get('/:id', recipeController.getRecipe.bind(recipeController));
recipeRouter.patch('/:id', recipeController.updateRecipe.bind(recipeController));
recipeRouter.delete('/:id', recipeController.deleteRecipe.bind(recipeController));

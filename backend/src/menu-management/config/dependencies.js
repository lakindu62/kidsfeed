import MongoRecipeRepository from '../infrastructure/repositories/MongoRecipeRepository.js';
import USDANutritionService from '../infrastructure/services/USDANutritionService.js';
import NutritionService from '../application/services/NutritionService.js';
import CreateRecipeUseCase from '../application/use-cases/recipe/CreateRecipeUseCase.js';
import GetRecipeUseCase from '../application/use-cases/recipe/GetRecipeUseCase.js';
import GetAllRecipesUseCase from '../application/use-cases/recipe/GetAllRecipesUseCase.js';
import UpdateRecipeUseCase from '../application/use-cases/recipe/UpdateRecipeUseCase.js';
import DeleteRecipeUseCase from '../application/use-cases/recipe/DeleteRecipeUseCase.js';
import SearchRecipeUseCase from '../application/use-cases/recipe/SearchRecipeUseCase.js';
import CalculateNutritionUseCase from '../application/use-cases/nutrition/CalculateNutritionUseCase.js';
import RecipeController from '../presentation/controllers/RecipeController.js';
import NutritionController from '../presentation/controllers/NutritionController.js';

// Singleton DI container; initialises dependencies bottom-up (infrastructure → services → use cases → controllers)
class DependencyContainer {
  constructor() {
    this.instances = {};
    this._initializeInfrastructure();
    this._initializeServices();
    this._initializeUseCases();
    this._initializeControllers();
  }

  _initializeInfrastructure() {
    this.instances.recipeRepository = new MongoRecipeRepository();
    this.instances.usdaNutritionService = new USDANutritionService();
  }

  _initializeServices() {
    this.instances.nutritionService = new NutritionService(
      this.instances.usdaNutritionService
    );
  }

  _initializeUseCases() {
    this.instances.createRecipeUseCase = new CreateRecipeUseCase(
      this.instances.recipeRepository,
      this.instances.nutritionService
    );
    this.instances.getRecipeUseCase = new GetRecipeUseCase(
      this.instances.recipeRepository
    );
    this.instances.getAllRecipesUseCase = new GetAllRecipesUseCase(
      this.instances.recipeRepository
    );
    this.instances.updateRecipeUseCase = new UpdateRecipeUseCase(
      this.instances.recipeRepository,
      this.instances.nutritionService
    );
    this.instances.deleteRecipeUseCase = new DeleteRecipeUseCase(
      this.instances.recipeRepository
    );
    this.instances.searchRecipeUseCase = new SearchRecipeUseCase(
      this.instances.recipeRepository
    );
    this.instances.calculateNutritionUseCase = new CalculateNutritionUseCase(
      this.instances.nutritionService
    );
  }

  _initializeControllers() {
    this.instances.recipeController = new RecipeController({
      createRecipeUseCase: this.instances.createRecipeUseCase,
      getRecipeUseCase: this.instances.getRecipeUseCase,
      getAllRecipesUseCase: this.instances.getAllRecipesUseCase,
      updateRecipeUseCase: this.instances.updateRecipeUseCase,
      deleteRecipeUseCase: this.instances.deleteRecipeUseCase,
      searchRecipeUseCase: this.instances.searchRecipeUseCase,
    });
    this.instances.nutritionController = new NutritionController({
      calculateNutritionUseCase: this.instances.calculateNutritionUseCase,
    });
  }

  // Retrieves a registered dependency by name; throws if not found
  get(name) {
    if (!this.instances[name]) {
      throw new Error(`Dependency '${name}' not found in container`);
    }
    return this.instances[name];
  }
}

export default new DependencyContainer();

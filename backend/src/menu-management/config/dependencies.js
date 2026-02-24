/**
 * Dependency Injection Container
 *
 * Centralized container that manages the creation, configuration, and lifecycle
 * of all application dependencies. This module implements the Dependency Injection
 * pattern and Service Locator pattern, providing a single source of truth for
 * application-wide dependency wiring.
 *
 * Architecture Benefits:
 * - **Dependency Inversion**: High-level modules don't depend on low-level modules
 * - **Single Responsibility**: Each class focuses on its core logic, not dependency creation
 * - **Testability**: Easy to swap real implementations with mocks for testing
 * - **Maintainability**: Centralized configuration makes dependency changes easier
 * - **Loose Coupling**: Components depend on abstractions, not concrete implementations
 *
 * Container Structure:
 * The container initializes dependencies in four layers, respecting Clean Architecture:
 * 1. Infrastructure Layer: Repositories, external API services
 * 2. Application Services: Domain-agnostic application services
 * 3. Use Cases: Application-specific business logic coordinators
 * 4. Presentation Layer: HTTP controllers
 *
 * Initialization Flow:
 * Infrastructure → Services → Use Cases → Controllers
 * This order ensures dependencies are available when needed by dependent components.
 *
 * Singleton Pattern:
 * The container itself is exported as a singleton (single shared instance),
 * ensuring consistent dependency instances across the application.
 *
 * Usage Patterns:
 * - Access dependencies via get() method
 * - Container is imported and used directly (no instantiation needed)
 * - Primarily used in application bootstrap and route configuration
 *
 * Testing Strategy:
 * For testing, you can:
 * - Create a separate test container with mock implementations
 * - Directly instantiate classes with mock dependencies (bypass container)
 * - Use dependency injection at the class level for maximum flexibility
 *
 * @module menu-management/config/dependencies
 * @class DependencyContainer
 *
 * @example
 * // Import the singleton container
 * import container from './config/dependencies';
 *
 * // Access controllers for route configuration
 * const recipeController = container.get('recipeController');
 * const nutritionController = container.get('nutritionController');
 *
 * // Use in Express routes
 * const recipeRouter = createRecipeRoutes(recipeController);
 * const nutritionRouter = createNutritionRoutes(nutritionController);
 *
 * @example
 * // Dependency graph visualization:
 * //
 * // Controllers (Presentation)
 * //   ├── RecipeController
 * //   │     ├── CreateRecipeUseCase
 * //   │     │     ├── MongoRecipeRepository
 * //   │     │     └── NutritionService → USDANutritionService
 * //   │     ├── GetRecipeUseCase
 * //   │     │     └── MongoRecipeRepository
 * //   │     └── ... (other use cases)
 * //   │
 * //   └── NutritionController
 * //         └── CalculateNutritionUseCase
 * //               └── NutritionService → USDANutritionService
 */

// ============================================================================
// Domain Layer Imports
// (no direct domain entity imports required in this container)
// ============================================================================

// ============================================================================
// Infrastructure Layer Imports
// ============================================================================
import MongoRecipeRepository from '../infrastructure/repositories/MongoRecipeRepository.js';
import USDANutritionService from '../infrastructure/services/USDANutritionService.js';

// ============================================================================
// Application Layer Imports - Services
// ============================================================================
import NutritionService from '../application/services/NutritionService.js';

// ============================================================================
// Application Layer Imports - Recipe Use Cases
// ============================================================================
import CreateRecipeUseCase from '../application/use-cases/recipe/CreateRecipeUseCase.js';
import GetRecipeUseCase from '../application/use-cases/recipe/GetRecipeUseCase.js';
import GetAllRecipesUseCase from '../application/use-cases/recipe/GetAllRecipesUseCase.js';
import UpdateRecipeUseCase from '../application/use-cases/recipe/UpdateRecipeUseCase.js';
import DeleteRecipeUseCase from '../application/use-cases/recipe/DeleteRecipeUseCase.js';
import SearchRecipeUseCase from '../application/use-cases/recipe/SearchRecipeUseCase.js';

// ============================================================================
// Application Layer Imports - Nutrition Use Cases
// ============================================================================
import CalculateNutritionUseCase from '../application/use-cases/nutrition/CalculateNutritionUseCase.js';

// ============================================================================
// Presentation Layer Imports
// ============================================================================
import RecipeController from '../presentation/controllers/RecipeController.js';
import NutritionController from '../presentation/controllers/NutritionController.js';

/**
 * Dependency Injection Container Class
 *
 * Manages the lifecycle and wiring of all application dependencies.
 * Initialized once as a singleton and shared across the application.
 */
class DependencyContainer {
  /**
   * Constructs the dependency container and initializes all layers
   *
   * Initialization happens in a specific order to respect dependency chains:
   * 1. Infrastructure (databases, external APIs)
   * 2. Application services (domain-agnostic services)
   * 3. Use cases (business logic coordinators)
   * 4. Controllers (HTTP request handlers)
   *
   * @constructor
   */
  constructor() {
    /**
     * Internal registry of all dependency instances
     * Maps dependency names to their singleton instances
     * @type {Object.<string, any>}
     * @private
     */
    this.instances = {};

    // Initialize dependencies in dependency order (bottom-up in Clean Architecture)
    this._initializeInfrastructure();
    this._initializeServices();
    this._initializeUseCases();
    this._initializeControllers();
  }

  /**
   * Initializes infrastructure layer dependencies
   *
   * Infrastructure layer components have no dependencies on other application layers.
   * They provide foundational services like data persistence and external API integration.
   *
   * Components initialized:
   * - MongoRecipeRepository: MongoDB-based recipe data access
   * - USDANutritionService: USDA FoodData Central API integration
   *
   * @private
   */
  _initializeInfrastructure() {
    /**
     * Recipe repository for MongoDB persistence
     * Implements IRecipeRepository interface for data access operations
     * @type {MongoRecipeRepository}
     */
    this.instances.recipeRepository = new MongoRecipeRepository();

    /**
     * USDA nutrition API service for fetching ingredient nutritional data
     * Integrates with USDA FoodData Central API
     * @type {USDANutritionService}
     */
    this.instances.usdaNutritionService = new USDANutritionService();
  }

  /**
   * Initializes application service layer dependencies
   *
   * Application services depend only on infrastructure components.
   * They provide domain-agnostic capabilities used by multiple use cases.
   *
   * Components initialized:
   * - NutritionService: Adapter between domain and USDA API
   *
   * @private
   */
  _initializeServices() {
    /**
     * Nutrition service adapter
     * Wraps USDANutritionService and transforms results into domain value objects
     * Used by CreateRecipeUseCase, UpdateRecipeUseCase, and CalculateNutritionUseCase
     * @type {NutritionService}
     */
    this.instances.nutritionService = new NutritionService(
      this.instances.usdaNutritionService
    );
  }

  /**
   * Initializes use case layer dependencies
   *
   * Use cases orchestrate business logic and depend on repositories and services.
   * Each use case represents a single user action or business operation.
   *
   * Components initialized:
   * - Recipe use cases (create, read, update, delete, search)
   * - Nutrition use cases (calculate)
   *
   * @private
   */
  _initializeUseCases() {
    /**
     * Use case for creating new recipes with optional nutrition calculation
     * Dependencies: recipeRepository, nutritionService
     * @type {CreateRecipeUseCase}
     */
    this.instances.createRecipeUseCase = new CreateRecipeUseCase(
      this.instances.recipeRepository,
      this.instances.nutritionService
    );

    /**
     * Use case for retrieving a single recipe by ID
     * Dependencies: recipeRepository
     * @type {GetRecipeUseCase}
     */
    this.instances.getRecipeUseCase = new GetRecipeUseCase(
      this.instances.recipeRepository
    );

    /**
     * Use case for retrieving paginated list of recipes with filters
     * Dependencies: recipeRepository
     * @type {GetAllRecipesUseCase}
     */
    this.instances.getAllRecipesUseCase = new GetAllRecipesUseCase(
      this.instances.recipeRepository
    );

    /**
     * Use case for updating existing recipes with optional nutrition recalculation
     * Dependencies: recipeRepository, nutritionService
     * @type {UpdateRecipeUseCase}
     */
    this.instances.updateRecipeUseCase = new UpdateRecipeUseCase(
      this.instances.recipeRepository,
      this.instances.nutritionService
    );

    /**
     * Use case for soft-deleting recipes (sets isActive: false)
     * Dependencies: recipeRepository
     * @type {DeleteRecipeUseCase}
     */
    this.instances.deleteRecipeUseCase = new DeleteRecipeUseCase(
      this.instances.recipeRepository
    );

    /**
     * Use case for searching recipes by ingredient or dietary flags
     * Dependencies: recipeRepository
     * @type {SearchRecipeUseCase}
     */
    this.instances.searchRecipeUseCase = new SearchRecipeUseCase(
      this.instances.recipeRepository
    );

    /**
     * Use case for calculating nutritional information from ingredient lists
     * Dependencies: nutritionService
     * @type {CalculateNutritionUseCase}
     */
    this.instances.calculateNutritionUseCase = new CalculateNutritionUseCase(
      this.instances.nutritionService
    );
  }

  /**
   * Initializes presentation layer dependencies (controllers)
   *
   * Controllers depend on use cases and are responsible for HTTP request/response handling.
   * They are the entry points for all API endpoints.
   *
   * Components initialized:
   * - RecipeController: Handles all recipe-related HTTP endpoints
   * - NutritionController: Handles nutrition calculation endpoint
   *
   * @private
   */
  _initializeControllers() {
    /**
     * Recipe controller for all recipe-related HTTP endpoints
     * Handles CRUD operations and search functionality
     *
     * Dependencies:
     * - createRecipeUseCase, getRecipeUseCase, getAllRecipesUseCase
     * - updateRecipeUseCase, deleteRecipeUseCase, searchRecipeUseCase
     *
     * @type {RecipeController}
     */
    this.instances.recipeController = new RecipeController({
      createRecipeUseCase: this.instances.createRecipeUseCase,
      getRecipeUseCase: this.instances.getRecipeUseCase,
      getAllRecipesUseCase: this.instances.getAllRecipesUseCase,
      updateRecipeUseCase: this.instances.updateRecipeUseCase,
      deleteRecipeUseCase: this.instances.deleteRecipeUseCase,
      searchRecipeUseCase: this.instances.searchRecipeUseCase,
    });

    /**
     * Nutrition controller for nutrition calculation endpoint
     *
     * Dependencies:
     * - calculateNutritionUseCase
     *
     * @type {NutritionController}
     */
    this.instances.nutritionController = new NutritionController({
      calculateNutritionUseCase: this.instances.calculateNutritionUseCase,
    });
  }

  /**
   * Retrieves a dependency instance by name
   *
   * Provides type-safe access to registered dependencies with error handling
   * for missing dependencies. Used primarily in application bootstrap and
   * route configuration.
   *
   * @param {string} name - The name of the dependency to retrieve
   * @returns {any} The dependency instance
   * @throws {Error} If the requested dependency is not found in the container
   *
   * @example
   * // Get controller for route configuration
   * const recipeController = container.get('recipeController');
   * const recipeRouter = createRecipeRoutes(recipeController);
   *
   * @example
   * // Get use case for direct testing
   * const createUseCase = container.get('createRecipeUseCase');
   * const recipe = await createUseCase.execute(recipeData);
   *
   * @example
   * // Error handling for missing dependency
   * try {
   *   const service = container.get('nonExistentService');
   * } catch (error) {
   *   console.error(error.message);
   *   // "Dependency 'nonExistentService' not found in container"
   * }
   */
  get(name) {
    // Check if the requested dependency exists in the registry
    if (!this.instances[name]) {
      throw new Error(`Dependency '${name}' not found in container`);
    }

    // Return the singleton instance
    return this.instances[name];
  }
}

/**
 * Singleton instance of the dependency container
 *
 * Exported as a singleton to ensure all parts of the application share
 * the same dependency instances. This provides consistency and prevents
 * duplicate service instances.
 *
 * @type {DependencyContainer}
 *
 * @example
 * // Import and use the container
 * import container from './config/dependencies';
 * const controller = container.get('recipeController');
 */
export default new DependencyContainer();

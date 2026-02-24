/**
 * Recipe Routes Configuration
 *
 * Defines all HTTP routes for recipe-related operations and maps them to
 * controller methods. This module implements the Router factory pattern,
 * creating an Express router configured with dependency injection.
 *
 * Route Design:
 * - RESTful conventions for CRUD operations
 * - Separate search endpoints for specialized queries
 * - Consistent URL structure and HTTP method usage
 * - Clean separation between routing and controller logic
 *
 * Responsibilities:
 * 1. Define URL patterns for all recipe endpoints
 * 2. Map HTTP methods (GET, POST, PUT, DELETE) to controller methods
 * 3. Preserve 'this' context for controller methods via arrow functions
 * 4. Support dependency injection for testability
 * 5. Return configured Express Router instance
 *
 * Dependency Injection:
 * This factory function accepts a controller instance, enabling:
 * - Easy unit testing with mock controllers
 * - Flexible configuration in different environments
 * - Clear dependency declaration
 * - Simplified integration with DI containers
 *
 * Route Organization:
 * 1. CRUD operations on /api/recipes
 * 2. Search operations on /api/recipes/search/*
 *
 * IMPORTANT: Route Order Matters!
 * Express matches routes in the order they are defined. Specific routes
 * (like /search/*) must be defined BEFORE parameterized routes (/:id)
 * to prevent route conflicts.
 *
 * @module menu-management/presentation/routes/recipeRoutes
 * @function createRecipeRoutes
 * @param {RecipeController} recipeController - Controller instance with recipe operation methods
 * @returns {express.Router} Configured Express router with all recipe routes
 *
 * @example
 * // Create routes with controller instance
 * import createRecipeRoutes from './routes/recipeRoutes';
 * import RecipeController from './controllers/RecipeController';
 *
 * const recipeController = new RecipeController({
 *   createRecipeUseCase,
 *   getRecipeUseCase,
 *   // ... other use cases
 * });
 *
 * const recipeRouter = createRecipeRoutes(recipeController);
 * app.use('/api/recipes', recipeRouter);
 *
 * @example
 * // Available endpoints after mounting at /api/recipes:
 * // POST   /api/recipes                    - Create new recipe
 * // GET    /api/recipes                    - List recipes (with filters & pagination)
 * // GET    /api/recipes/search/ingredient  - Search by ingredient name
 * // GET    /api/recipes/search/dietary     - Search by dietary flags
 * // GET    /api/recipes/:id                - Get single recipe
 * // PUT    /api/recipes/:id                - Update recipe (should be PATCH)
 * // DELETE /api/recipes/:id                - Soft-delete recipe
 *
 * @see {@link https://expressjs.com/en/guide/routing.html|Express Routing Guide}
 */
import express from 'express';

/**
 * Factory function that creates and configures the recipe router
 *
 * @param {RecipeController} recipeController - Controller with recipe operation methods
 * @returns {express.Router} Configured Express router instance
 */
const createRecipeRoutes = (recipeController) => {
  // Create a new Express Router instance for recipe routes
  const router = express.Router();

  // =========================================================================
  // CRUD Operations (RESTful endpoints)
  // =========================================================================

  /**
   * POST / - Create a new recipe
   *
   * Request body: CreateRecipeRequest DTO
   * Response: 201 Created with RecipeResponse
   *
   * Validates request, creates recipe with optional nutrition calculation.
   *
   * @example
   * POST /api/recipes
   * Body: {
   *   "name": "Chicken Stir Fry",
   *   "ingredients": [...],
   *   "instructions": "...",
   *   "servingSize": 2,
   *   "createdBy": "user-123"
   * }
   */
  router.post('/', (req, res, next) =>
    recipeController.createRecipe(req, res, next)
  );

  /**
   * GET / - List all recipes with optional filters and pagination
   *
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - vegetarian, vegan, halal, glutenFree, dairyFree, nutFree: Filter flags
   *
   * Response: 200 OK with array of RecipeResponse and pagination metadata
   *
   * @example
   * GET /api/recipes?page=1&limit=20&vegetarian=true&glutenFree=true
   */
  router.get('/', (req, res, next) =>
    recipeController.getAllRecipes(req, res, next)
  );

  // =========================================================================
  // Search Operations (Specialized query endpoints)
  // =========================================================================

  /**
   * GET /search/ingredient - Search recipes by ingredient name
   *
   * Query parameters:
   * - name: Ingredient name or partial name (required)
   *
   * Response: 200 OK with array of RecipeResponse and count
   *
   * Performs case-insensitive partial match on ingredient names.
   *
   * @example
   * GET /api/recipes/search/ingredient?name=chicken
   */
  router.get('/search/ingredient', (req, res, next) =>
    recipeController.searchByIngredient(req, res, next)
  );

  /**
   * GET /search/dietary - Search recipes by dietary flags
   *
   * Query parameters:
   * - vegetarian, vegan, halal, glutenFree, dairyFree, nutFree: Boolean flags
   *
   * Response: 200 OK with array of RecipeResponse and count
   *
   * Returns recipes matching ALL specified dietary requirements (AND operation).
   * At least one flag must be set to true.
   *
   * @example
   * GET /api/recipes/search/dietary?vegan=true&nutFree=true
   */
  router.get('/search/dietary', (req, res, next) =>
    recipeController.searchByDietaryFlags(req, res, next)
  );

  /**
   * GET /:id - Retrieve a single recipe by ID
   *
   * URL parameters:
   * - id: Recipe MongoDB ObjectId
   *
   * Response: 200 OK with RecipeResponse or 404 Not Found
   *
   * @example
   * GET /api/recipes/64f1a2b3c4d5e6f7a8b9c0d1
   */
  router.get('/:id', (req, res, next) =>
    recipeController.getRecipe(req, res, next)
  );

  /**
   * PUT /:id - Update an existing recipe
   *
   * URL parameters:
   * - id: Recipe MongoDB ObjectId
   *
   * Request body: UpdateRecipeRequest DTO (supports partial updates)
   * Response: 200 OK with updated RecipeResponse or 404 Not Found
   *
   * @example
   * PUT /api/recipes/64f1a2b3c4d5e6f7a8b9c0d1
   * Body: { "name": "Updated Name", "prepTime": 25 }
   */
  router.patch('/:id', (req, res, next) =>
    recipeController.updateRecipe(req, res, next)
  );

  /**
   * DELETE /:id - Soft-delete a recipe (sets isActive: false)
   *
   * URL parameters:
   * - id: Recipe MongoDB ObjectId
   *
   * Response: 200 OK with success message or 404 Not Found
   *
   * Note: This is a soft delete - recipe remains in database but is hidden.
   *
   * @example
   * DELETE /api/recipes/64f1a2b3c4d5e6f7a8b9c0d1
   */
  router.delete('/:id', (req, res, next) =>
    recipeController.deleteRecipe(req, res, next)
  );

  // Return the fully configured router
  return router;
};

export default createRecipeRoutes;

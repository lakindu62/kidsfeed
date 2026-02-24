/**
 * RecipeController
 *
 * Presentation layer controller responsible for handling HTTP requests related
 * to recipe operations. This class implements the Controller pattern from Clean
 * Architecture, acting as the entry point for all recipe-related API endpoints.
 *
 * Responsibilities:
 * 1. Parse and validate HTTP request parameters (body, query, params)
 * 2. Transform request data into DTOs for use cases
 * 3. Orchestrate use case execution
 * 4. Transform domain entities into response DTOs
 * 5. Format HTTP responses with appropriate status codes
 * 6. Handle errors and delegate to error handling middleware
 *
 * Architecture Role:
 * - **Presentation Layer**: Interface between HTTP and application layer
 * - **Adapter**: Translates HTTP requests to use case inputs
 * - **Coordinator**: Orchestrates validation, execution, and response formatting
 *
 * Error Handling Strategy:
 * - Validation errors return 400 Bad Request with error details
 * - Domain exceptions (e.g., RecipeNotFoundException) delegated to error middleware
 * - Unexpected errors delegated to Express error handling via next(error)
 *
 * Response Format:
 * All successful responses follow a consistent structure:
 * {
 *   success: true,
 *   message: "Operation description",
 *   data: <RecipeResponse or array of RecipeResponse>,
 *   pagination: <optional pagination metadata>
 * }
 *
 * @class RecipeController
 * @module menu-management/presentation/controllers/RecipeController
 *
 * @example
 * // Initialize controller with use cases (typically in dependency injection container)
 * const recipeController = new RecipeController({
 *   createRecipeUseCase,
 *   getRecipeUseCase,
 *   getAllRecipesUseCase,
 *   updateRecipeUseCase,
 *   deleteRecipeUseCase,
 *   searchRecipeUseCase
 * });
 *
 * @example
 * // Register routes in Express
 * router.post('/recipes', recipeController.createRecipe.bind(recipeController));
 * router.get('/recipes/:id', recipeController.getRecipe.bind(recipeController));
 * router.get('/recipes', recipeController.getAllRecipes.bind(recipeController));
 * router.patch('/recipes/:id', recipeController.updateRecipe.bind(recipeController));
 * router.delete('/recipes/:id', recipeController.deleteRecipe.bind(recipeController));
 * router.get('/recipes/search/ingredient', recipeController.searchByIngredient.bind(recipeController));
 * router.get('/recipes/search/dietary', recipeController.searchByDietaryFlags.bind(recipeController));
 */
import CreateRecipeRequest from '../../application/dtos/requests/CreateRecipeRequest';
import UpdateRecipeRequest from '../../application/dtos/requests/UpdateRecipeRequest';
import RecipeResponse from '../../application/dtos/requests/RecipeResponse';

class RecipeController {
  /**
   * Initializes the controller with required use cases via dependency injection
   *
   * @constructor
   * @param {Object} dependencies - Object containing all required use cases
   * @param {CreateRecipeUseCase} dependencies.createRecipeUseCase - Use case for creating recipes
   * @param {GetRecipeUseCase} dependencies.getRecipeUseCase - Use case for retrieving a single recipe
   * @param {GetAllRecipesUseCase} dependencies.getAllRecipesUseCase - Use case for listing recipes
   * @param {UpdateRecipeUseCase} dependencies.updateRecipeUseCase - Use case for updating recipes
   * @param {DeleteRecipeUseCase} dependencies.deleteRecipeUseCase - Use case for soft-deleting recipes
   * @param {SearchRecipeUseCase} dependencies.searchRecipeUseCase - Use case for searching recipes
   *
   * @example
   * const controller = new RecipeController({
   *   createRecipeUseCase: new CreateRecipeUseCase(recipeRepo, nutritionService),
   *   getRecipeUseCase: new GetRecipeUseCase(recipeRepo),
   *   getAllRecipesUseCase: new GetAllRecipesUseCase(recipeRepo),
   *   updateRecipeUseCase: new UpdateRecipeUseCase(recipeRepo, nutritionService),
   *   deleteRecipeUseCase: new DeleteRecipeUseCase(recipeRepo),
   *   searchRecipeUseCase: new SearchRecipeUseCase(recipeRepo)
   * });
   */
  constructor({
    createRecipeUseCase,
    getRecipeUseCase,
    getAllRecipesUseCase,
    updateRecipeUseCase,
    deleteRecipeUseCase,
    searchRecipeUseCase,
  }) {
    /** Use case for creating new recipes */
    this.createRecipeUseCase = createRecipeUseCase;

    /** Use case for retrieving a single recipe by ID */
    this.getRecipeUseCase = getRecipeUseCase;

    /** Use case for retrieving paginated list of recipes */
    this.getAllRecipesUseCase = getAllRecipesUseCase;

    /** Use case for updating existing recipes */
    this.updateRecipeUseCase = updateRecipeUseCase;

    /** Use case for soft-deleting recipes */
    this.deleteRecipeUseCase = deleteRecipeUseCase;

    /** Use case for searching recipes by various criteria */
    this.searchRecipeUseCase = searchRecipeUseCase;
  }

  /**
   * Creates a new recipe
   *
   * Handles POST /api/recipes
   * Validates request body, executes creation use case, returns created recipe.
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Object} req.body - Recipe data (name, ingredients, instructions, etc.)
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   *
   * @throws {400} If validation fails (invalid or missing required fields)
   * @throws {500} If creation fails due to unexpected errors
   *
   * @example
   * // POST /api/recipes
   * // Request body:
   * {
   *   "name": "Chicken Stir Fry",
   *   "ingredients": [{ "name": "chicken", "quantity": 200, "unit": "g" }],
   *   "instructions": "Cook chicken...",
   *   "servingSize": 2,
   *   "prepTime": 20,
   *   "createdBy": "user-123"
   * }
   *
   * // Response (201 Created):
   * {
   *   "success": true,
   *   "message": "Recipe created successfully",
   *   "data": { ...recipe }
   * }
   */
  async createRecipe(req, res, next) {
    try {
      // Step 1: Transform request body into validated DTO
      const recipeRequest = new CreateRecipeRequest(req.body);

      // Step 2: Validate the request DTO
      const validationErrors = recipeRequest.validate();

      // Step 3: Return 400 if validation failed
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: validationErrors,
        });
      }

      // Step 4: Execute the create use case with validated data
      const recipe = await this.createRecipeUseCase.execute(recipeRequest);

      // Step 5: Transform domain entity into response DTO
      const response = new RecipeResponse(recipe);

      // Step 6: Return 201 Created with the new recipe
      res.status(201).json({
        success: true,
        message: 'Recipe created successfully',
        data: response,
      });
    } catch (error) {
      // Delegate error handling to Express error middleware
      next(error);
    }
  }

  /**
   * Retrieves a single recipe by ID
   *
   * Handles GET /api/recipes/:id
   * Fetches recipe from use case, transforms to response DTO.
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Recipe ID to retrieve
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   *
   * @throws {404} If recipe not found (via error middleware)
   * @throws {500} If retrieval fails due to unexpected errors
   *
   * @example
   * // GET /api/recipes/64f1a2b3c4d5e6f7a8b9c0d1
   * // Response (200 OK):
   * {
   *   "success": true,
   *   "data": { ...recipe }
   * }
   */
  async getRecipe(req, res, next) {
    try {
      // Extract recipe ID from URL parameters
      const { id } = req.params;

      // Execute the get use case (throws RecipeNotFoundException if not found)
      const recipe = await this.getRecipeUseCase.execute(id);

      // Transform domain entity into response DTO
      const response = new RecipeResponse(recipe);

      // Return 200 OK with the recipe
      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      // Delegate error handling to Express error middleware
      // RecipeNotFoundException will be caught and converted to 404
      next(error);
    }
  }

  /**
   * Retrieves a paginated list of recipes with optional dietary filters
   *
   * Handles GET /api/recipes?page=1&limit=10&vegetarian=true&halal=true
   * Parses query parameters, validates pagination, executes list use case.
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Object} req.query - URL query parameters
   * @param {string} [req.query.page='1'] - Page number (1-based)
   * @param {string} [req.query.limit='10'] - Items per page (1-100)
   * @param {string} [req.query.vegetarian] - Filter for vegetarian recipes ('true'/'false')
   * @param {string} [req.query.vegan] - Filter for vegan recipes
   * @param {string} [req.query.halal] - Filter for halal recipes
   * @param {string} [req.query.glutenFree] - Filter for gluten-free recipes
   * @param {string} [req.query.dairyFree] - Filter for dairy-free recipes
   * @param {string} [req.query.nutFree] - Filter for nut-free recipes
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   *
   * @throws {400} If page < 1 or limit not in range [1, 100]
   * @throws {500} If retrieval fails due to unexpected errors
   *
   * @example
   * // GET /api/recipes?page=2&limit=5&vegetarian=true&halal=true
   * // Response (200 OK):
   * {
   *   "success": true,
   *   "data": [ ...recipes ],
   *   "pagination": {
   *     "total": 50,
   *     "page": 2,
   *     "totalPages": 10,
   *     "limit": 5
   *   }
   * }
   */
  async getAllRecipes(req, res, next) {
    try {
      // Parse dietary flag filters from query string
      const filters = {
        vegetarian: req.query.vegetarian === 'true',
        vegan: req.query.vegan === 'true',
        halal: req.query.halal === 'true',
        glutenFree: req.query.glutenFree === 'true',
        dairyFree: req.query.dairyFree === 'true',
        nutFree: req.query.nutFree === 'true',
      };

      // Parse pagination parameters with defaults
      const pagination = {
        page: parseInt(req.query.page) || 1, // Default to page 1
        limit: parseInt(req.query.limit) || 10, // Default to 10 items per page
      };

      // Validate page number is positive
      if (pagination.page < 1) {
        return res.status(400).json({
          success: false,
          error: 'Page must be greater than 0',
        });
      }

      // Validate limit is within acceptable range (prevent abuse)
      if (pagination.limit < 1 || pagination.limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100',
        });
      }

      // Execute the get all use case with filters and pagination
      const result = await this.getAllRecipesUseCase.execute(
        filters,
        pagination
      );

      // Transform each domain entity into a response DTO
      const recipes = result.recipes.map(
        (recipe) => new RecipeResponse(recipe)
      );

      // Return 200 OK with recipes and pagination metadata
      res.status(200).json({
        success: true,
        data: recipes,
        pagination: {
          total: result.total, // Total matching records
          page: result.page, // Current page number
          totalPages: result.totalPages, // Total pages available
          limit: pagination.limit, // Items per page
        },
      });
    } catch (error) {
      // Delegate error handling to Express error middleware
      next(error);
    }
  }

  /**
   * Updates an existing recipe (partial update)
   *
   * Handles PATCH /api/recipes/:id
   * Validates request body, executes update use case, returns updated recipe.
   * Supports partial updates - only provided fields are updated.
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Recipe ID to update
   * @param {Object} req.body - Partial recipe data to update
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   *
   * @throws {400} If validation fails (invalid field values)
   * @throws {404} If recipe not found (via error middleware)
   * @throws {500} If update fails due to unexpected errors
   *
   * @example
   * // PATCH /api/recipes/64f1a2b3c4d5e6f7a8b9c0d1
   * // Request body (partial update):
   * {
   *   "name": "Updated Recipe Name",
   *   "prepTime": 25
   * }
   *
   * // Response (200 OK):
   * {
   *   "success": true,
   *   "message": "Recipe updated successfully",
   *   "data": { ...updatedRecipe }
   * }
   */
  async updateRecipe(req, res, next) {
    try {
      // Extract recipe ID from URL parameters
      const { id } = req.params;

      // Transform request body into validated DTO (supports partial updates)
      const updateRequest = new UpdateRecipeRequest(req.body);

      // Validate the update request DTO
      const validationErrors = updateRequest.validate();

      // Return 400 if validation failed
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: validationErrors,
        });
      }

      // Execute the update use case with ID and validated data
      const recipe = await this.updateRecipeUseCase.execute(id, updateRequest);

      // Transform domain entity into response DTO
      const response = new RecipeResponse(recipe);

      // Return 200 OK with the updated recipe
      res.status(200).json({
        success: true,
        message: 'Recipe updated successfully',
        data: response,
      });
    } catch (error) {
      // Delegate error handling to Express error middleware
      next(error);
    }
  }

  /**
   * Soft-deletes a recipe (sets isActive to false)
   *
   * Handles DELETE /api/recipes/:id
   * Executes soft delete use case. Recipe is not permanently removed.
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Recipe ID to delete
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   *
   * @throws {404} If recipe not found (via error middleware)
   * @throws {500} If deletion fails due to unexpected errors
   *
   * @example
   * // DELETE /api/recipes/64f1a2b3c4d5e6f7a8b9c0d1
   * // Response (200 OK):
   * {
   *   "success": true,
   *   "message": "Recipe deleted successfully"
   * }
   */
  async deleteRecipe(req, res, next) {
    try {
      // Extract recipe ID from URL parameters
      const { id } = req.params;

      // Execute the soft delete use case
      // Recipe is marked inactive, not permanently removed
      await this.deleteRecipeUseCase.execute(id);

      // Return 200 OK with success message (no data needed)
      res.status(200).json({
        success: true,
        message: 'Recipe deleted successfully',
      });
    } catch (error) {
      // Delegate error handling to Express error middleware
      next(error);
    }
  }

  /**
   * Searches for recipes containing a specific ingredient
   *
   * Handles GET /api/recipes/search/ingredient?name=chicken
   * Performs case-insensitive partial match on ingredient names.
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Object} req.query - URL query parameters
   * @param {string} req.query.name - Ingredient name to search for (required)
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   *
   * @throws {400} If ingredient name is missing or empty
   * @throws {500} If search fails due to unexpected errors
   *
   * @example
   * // GET /api/recipes/search/ingredient?name=chicken
   * // Response (200 OK):
   * {
   *   "success": true,
   *   "data": [ ...recipes ],
   *   "count": 15
   * }
   */
  async searchByIngredient(req, res, next) {
    try {
      // Extract ingredient name from query parameters
      const { name } = req.query;

      // Validate that ingredient name is provided and not empty
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Ingredient name is required',
        });
      }

      // Execute the search use case
      const recipes = await this.searchRecipeUseCase.searchByIngredient(name);

      // Transform each domain entity into a response DTO
      const response = recipes.map((recipe) => new RecipeResponse(recipe));

      // Return 200 OK with matching recipes and count
      res.status(200).json({
        success: true,
        data: response,
        count: response.length, // Convenience field for client
      });
    } catch (error) {
      // Delegate error handling to Express error middleware
      next(error);
    }
  }

  /**
   * Searches for recipes matching specified dietary flags
   *
   * Handles GET /api/recipes/search/dietary?vegetarian=true&halal=true
   * Returns recipes that match ALL specified dietary requirements (AND operation).
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Object} req.query - URL query parameters
   * @param {string} [req.query.vegetarian] - Filter for vegetarian ('true'/'false')
   * @param {string} [req.query.vegan] - Filter for vegan
   * @param {string} [req.query.halal] - Filter for halal
   * @param {string} [req.query.glutenFree] - Filter for gluten-free
   * @param {string} [req.query.dairyFree] - Filter for dairy-free
   * @param {string} [req.query.nutFree] - Filter for nut-free
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   *
   * @throws {400} If no dietary flags are set to true
   * @throws {500} If search fails due to unexpected errors
   *
   * @example
   * // GET /api/recipes/search/dietary?vegan=true&nutFree=true
   * // Response (200 OK):
   * {
   *   "success": true,
   *   "data": [ ...recipes ],
   *   "count": 8
   * }
   */
  async searchByDietaryFlags(req, res, next) {
    try {
      // Parse dietary flags from query string
      const flags = {
        vegetarian: req.query.vegetarian === 'true',
        vegan: req.query.vegan === 'true',
        halal: req.query.halal === 'true',
        glutenFree: req.query.glutenFree === 'true',
        dairyFree: req.query.dairyFree === 'true',
        nutFree: req.query.nutFree === 'true',
      };

      // Check if at least one flag is set to true
      const hasFlags = Object.values(flags).some((flag) => flag === true);

      // Return 400 if no flags are set (prevents fetching all recipes)
      if (!hasFlags) {
        return res.status(400).json({
          success: false,
          error: 'At least one dietary flag must be set to true',
        });
      }

      // Execute the search use case
      const recipes =
        await this.searchRecipeUseCase.searchByDietaryFlags(flags);

      // Transform each domain entity into a response DTO
      const response = recipes.map((recipe) => new RecipeResponse(recipe));

      // Return 200 OK with matching recipes and count
      res.status(200).json({
        success: true,
        data: response,
        count: response.length, // Convenience field for client
      });
    } catch (error) {
      // Delegate error handling to Express error middleware
      next(error);
    }
  }
}

export default RecipeController;

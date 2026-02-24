/**
 * Menu Management Module - Public API
 *
 * This is the main entry point and public API for the menu-management module.
 * It exports all components needed by the application's main server to integrate
 * the menu management functionality.
 *
 * Module Responsibilities:
 * 1. Bootstrap the menu management module by retrieving dependencies
 * 2. Configure and create Express routers with injected controllers
 * 3. Export configured routers for mounting in the main application
 * 4. Export error handling middleware for Express error handling chain
 * 5. Provide a clean, minimal public interface (encapsulation)
 *
 * Architecture Benefits:
 * - **Encapsulation**: Internal implementation details are hidden from consumers
 * - **Modularity**: Menu management can be easily added/removed from the app
 * - **Clean Integration**: Simple exports that integrate cleanly with Express
 * - **Dependency Management**: All DI wiring happens internally
 * - **Single Responsibility**: Module is self-contained and focused
 *
 * Integration Pattern:
 * This module follows a "plug-and-play" pattern where the main application
 * simply imports and mounts the routers without knowing about internal
 * dependencies, use cases, or repositories.
 *
 * Exported Components:
 * - recipeRouter: Express router for all recipe-related endpoints
 * - nutritionRouter: Express router for nutrition calculation endpoint
 * - errorHandler: Global error handling middleware
 *
 * Usage in Main Application:
 * The main Express app imports these components and mounts them at appropriate
 * base paths. The error handler is registered last in the middleware chain.
 *
 * @module menu-management
 *
 * @example
 * // In main application server file (app.js or server.js)
 * import express from 'express';
 * import {
 *   recipeRouter,
 *   nutritionRouter,
 *   errorHandler
 * } from './menu-management';
 *
 * const app = express();
 * app.use(express.json());
 *
 * // Mount menu management routers
 * app.use('/api/recipes', recipeRouter);
 * app.use('/api/nutrition', nutritionRouter);
 *
 * // Register error handler (must be last)
 * app.use(errorHandler);
 *
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 *
 * @example
 * // Available endpoints after mounting:
 * //
 * // Recipe Management:
 * // POST   /api/recipes                    - Create recipe
 * // GET    /api/recipes                    - List recipes (filtered, paginated)
 * // GET    /api/recipes/search/ingredient  - Search by ingredient
 * // GET    /api/recipes/search/dietary     - Search by dietary flags
 * // GET    /api/recipes/:id                - Get single recipe
 * // PUT    /api/recipes/:id                - Update recipe
 * // DELETE /api/recipes/:id                - Delete recipe (soft delete)
 * //
 * // Nutrition Calculation:
 * // POST   /api/nutrition/calculate        - Calculate nutrition for ingredients
 *
 * @example
 * // Module structure visualization:
 * //
 * // menu-management/
 * // ├── index.js (THIS FILE - Public API)
 * // ├── config/
 * // │   └── dependencies.js (DI Container)
 * // ├── domain/
 * // │   ├── entities/
 * // │   ├── value-objects/
 * // │   ├── repositories/ (interfaces)
 * // │   └── exceptions/
 * // ├── application/
 * // │   ├── use-cases/
 * // │   ├── services/
 * // │   └── dtos/
 * // ├── infrastructure/
 * // │   ├── repositories/ (implementations)
 * // │   ├── services/
 * // │   └── schemas/
 * // └── presentation/
 * //     ├── controllers/
 * //     ├── routes/
 * //     └── middleware/
 */

// ============================================================================
// Internal Module Imports
// ============================================================================

/**
 * Route factory functions for creating configured Express routers
 * These functions accept controller instances and return ready-to-use routers
 */
import createRecipeRoutes from './presentation/routes/recipeRoutes.js';
import createNutritionRoutes from './presentation/routes/nutritionRoutes.js';

/**
 * Global error handling middleware
 * Catches all errors from controllers and use cases, formats responses
 */
import errorHandler from './presentation/middleware/errorHandler.js';

/**
 * Dependency injection container
 * Manages all module dependencies and their lifecycle
 */
import container from './config/dependencies.js';

// ============================================================================
// Dependency Resolution
// ============================================================================

/**
 * Retrieve the recipe controller from the dependency container
 *
 * The controller has all recipe use cases injected and is ready to handle
 * HTTP requests for recipe operations.
 *
 * @type {RecipeController}
 */
const recipeController = container.get('recipeController');

/**
 * Retrieve the nutrition controller from the dependency container
 *
 * The controller has the nutrition calculation use case injected and is
 * ready to handle HTTP requests for nutrition calculations.
 *
 * @type {NutritionController}
 */
const nutritionController = container.get('nutritionController');

// ============================================================================
// Router Configuration
// ============================================================================

/**
 * Configured Express router for all recipe-related endpoints
 *
 * This router handles:
 * - CRUD operations (create, read, update, delete recipes)
 * - Search operations (by ingredient, dietary flags)
 * - Pagination and filtering
 *
 * Routes included:
 * - POST   /                 - Create new recipe
 * - GET    /                 - List recipes (with filters & pagination)
 * - GET    /search/ingredient - Search by ingredient name
 * - GET    /search/dietary    - Search by dietary flags
 * - GET    /:id              - Get single recipe by ID
 * - PUT    /:id              - Update existing recipe
 * - DELETE /:id              - Soft-delete recipe
 *
 * @type {express.Router}
 * @public
 *
 * @example
 * // Mount in main application
 * app.use('/api/recipes', recipeRouter);
 */
export const recipeRouter = createRecipeRoutes(recipeController);

/**
 * Configured Express router for nutrition calculation endpoint
 *
 * This router handles:
 * - Nutrition calculation from ingredient lists
 *
 * Routes included:
 * - POST /calculate - Calculate nutrition for ingredients
 *
 * @type {express.Router}
 * @public
 *
 * @example
 * // Mount in main application
 * app.use('/api/nutrition', nutritionRouter);
 */
export const nutritionRouter = createNutritionRoutes(nutritionController);

// ============================================================================
// Middleware Exports
// ============================================================================

/**
 * Global error handling middleware for Express
 *
 * Catches all errors thrown by controllers, use cases, or other middleware
 * and formats them into consistent JSON error responses with appropriate
 * HTTP status codes.
 *
 * Error types handled:
 * - Domain exceptions (RecipeNotFoundException, InvalidRecipeException)
 * - Mongoose validation errors (ValidationError)
 * - Mongoose casting errors (CastError - invalid ObjectId)
 * - MongoDB duplicate key errors (code 11000)
 * - Generic errors with custom status codes
 * - Unexpected errors (500 Internal Server Error)
 *
 * @type {Function}
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @public
 *
 * @example
 * // Register as last middleware in Express app
 * app.use(errorHandler);
 *
 * @see {@link ./presentation/middleware/errorHandler.js|Error Handler Implementation}
 */
export { errorHandler };

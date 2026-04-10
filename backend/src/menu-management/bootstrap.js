import express from 'express';
import createRecipeRoutes from './presentation/routes/recipeRoutes.js';
import createNutritionRoutes from './presentation/routes/nutritionRoutes.js';
import errorHandler from './presentation/middleware/errorHandler.js';
import container from './config/dependencies.js';

const createMenuManagementRouter = () => {
  const router = express.Router();
  const recipeController = container.get('recipeController');
  const nutritionController = container.get('nutritionController');

  // Recipe routes
  router.use('/recipes', createRecipeRoutes(recipeController));

  // Nutrition routes
  router.use('/nutrition', createNutritionRoutes(nutritionController));

  // Module-level error handler must be registered after module routes.
  router.use(errorHandler);

  return router;
};

export { createMenuManagementRouter };

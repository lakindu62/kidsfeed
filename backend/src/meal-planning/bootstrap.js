import express from 'express';
import createMealPlanRoutes from './presentation/routes/mealPlanRoutes.js';
import errorHandler from './presentation/middleware/errorHandler.js';
import container from './config/dependencies.js';

const createMealPlanningRouter = () => {
  const router = express.Router();
  const mealPlanController = container.get('mealPlanController');

  router.use('/meal-plans', createMealPlanRoutes(mealPlanController));

  // Module-level error handler must be registered after module routes.
  router.use(errorHandler);

  return router;
};

export { createMealPlanningRouter };

import createMealPlanRoutes from './presentation/routes/mealPlanRoutes.js';
import errorHandler from './presentation/middleware/errorHandler.js';
import container from './config/dependencies.js';

const mealPlanController = container.get('mealPlanController');

export const mealPlanRouter = createMealPlanRoutes(mealPlanController);
export { errorHandler as mealPlanningErrorHandler };

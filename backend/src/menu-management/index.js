import createRecipeRoutes from './presentation/routes/recipeRoutes.js';
import createNutritionRoutes from './presentation/routes/nutritionRoutes.js';
import errorHandler from './presentation/middleware/errorHandler.js';
import container from './config/dependencies.js';

const recipeController = container.get('recipeController');
const nutritionController = container.get('nutritionController');

export const recipeRouter = createRecipeRoutes(recipeController);
export const nutritionRouter = createNutritionRoutes(nutritionController);
export { errorHandler };

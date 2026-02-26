import createRecipeRoutes from './presentation/routes/recipeRoutes.js';
import errorHandler from './presentation/middleware/errorHandler.js';
import container from './config/dependencies.js';

const recipeController = container.get('recipeController');

export const recipeRouter = createRecipeRoutes(recipeController);
export { errorHandler };

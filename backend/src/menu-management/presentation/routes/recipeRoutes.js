import express from 'express';

// Factory that creates the Express recipe router; search routes must precede /:id
const createRecipeRoutes = (recipeController) => {
  const router = express.Router();

  router.post('/', (req, res, next) =>
    recipeController.createRecipe(req, res, next)
  );
  router.get('/', (req, res, next) =>
    recipeController.getAllRecipes(req, res, next)
  );

  router.get('/search/ingredient', (req, res, next) =>
    recipeController.searchByIngredient(req, res, next)
  );
  router.get('/search/dietary', (req, res, next) =>
    recipeController.searchByDietaryFlags(req, res, next)
  );

  router.get('/:id', (req, res, next) =>
    recipeController.getRecipe(req, res, next)
  );
  router.patch('/:id', (req, res, next) =>
    recipeController.updateRecipe(req, res, next)
  );
  router.delete('/:id', (req, res, next) =>
    recipeController.deleteRecipe(req, res, next)
  );

  return router;
};

export default createRecipeRoutes;

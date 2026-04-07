import express from 'express';

// Factory: creates Express router for nutrition endpoints
const createNutritionRoutes = (nutritionController) => {
  const router = express.Router();

  // POST /calculate — calculate total nutrition for a list of ingredients
  router.post('/calculate', (req, res, next) =>
    nutritionController.calculateNutrition(req, res, next)
  );

  return router;
};

export default createNutritionRoutes;

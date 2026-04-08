import express from 'express';

const createMealPlanRoutes = (mealPlanController) => {
  const router = express.Router();

  router.post('/', (req, res, next) =>
    mealPlanController.createMealPlan(req, res, next)
  );

  router.get('/:id', (req, res, next) =>
    mealPlanController.getMealPlan(req, res, next)
  );

  router.get('/school/:schoolId', (req, res, next) =>
    mealPlanController.getSchoolMealPlans(req, res, next)
  );

  router.put('/:id', (req, res, next) =>
    mealPlanController.updateMealPlan(req, res, next)
  );

  router.delete('/:id', (req, res, next) =>
    mealPlanController.deleteMealPlan(req, res, next)
  );

  // Confirm a meal plan by ID
  router.post('/:id/confirm', (req, res, next) =>
    mealPlanController.confirmMealPlan(req, res, next)
  );

  return router;
};

export default createMealPlanRoutes;

import CreateMealPlanRequest from '../../application/dtos/requests/CreateMealPlanRequest.js';
import MealPlanResponse from '../../application/dtos/responses/MealPlanResponse.js';

/** Handles HTTP requests for meal plan operations. */
class MealPlanController {
  constructor({
    createMealPlanUseCase,
    getMealPlanUseCase,
    getSchoolMealPlansUseCase,
    updateMealPlanUseCase,
    deleteMealPlanUseCase,
    confirmMealPlanUseCase,
  }) {
    this.createMealPlanUseCase = createMealPlanUseCase;
    this.getMealPlanUseCase = getMealPlanUseCase;
    this.getSchoolMealPlansUseCase = getSchoolMealPlansUseCase;
    this.updateMealPlanUseCase = updateMealPlanUseCase;
    this.deleteMealPlanUseCase = deleteMealPlanUseCase;
    this.confirmMealPlanUseCase = confirmMealPlanUseCase;
  }

  /** POST /api/meal-plans */
  async createMealPlan(req, res, next) {
    try {
      const mealPlanRequest = new CreateMealPlanRequest(req.body);

      const validationErrors = mealPlanRequest.validate();
      if (validationErrors.length > 0) {
        return res
          .status(400)
          .json({ success: false, errors: validationErrors });
      }

      const mealPlan =
        await this.createMealPlanUseCase.execute(mealPlanRequest);
      const response = new MealPlanResponse(mealPlan);

      res.status(201).json({
        success: true,
        message: 'Meal plan created successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/meal-plans/:id */
  async getMealPlan(req, res, next) {
    try {
      const { id } = req.params;
      const mealPlan = await this.getMealPlanUseCase.execute(id);
      const response = new MealPlanResponse(mealPlan);

      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/meal-plans/school/:schoolId */
  async getSchoolMealPlans(req, res, next) {
    try {
      const { schoolId } = req.params;
      const { status } = req.query;

      const filters = {};
      if (status) {
        filters.status = status;
      }

      const mealPlans = await this.getSchoolMealPlansUseCase.execute(
        schoolId,
        filters
      );
      const response = mealPlans.map((mp) => new MealPlanResponse(mp));

      res
        .status(200)
        .json({ success: true, data: response, count: response.length });
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/meal-plans/:id */
  async updateMealPlan(req, res, next) {
    try {
      const { id } = req.params;
      const mealPlan = await this.updateMealPlanUseCase.execute(id, req.body);
      const response = new MealPlanResponse(mealPlan);

      res.status(200).json({
        success: true,
        message: 'Meal plan updated successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/meal-plans/:id */
  async deleteMealPlan(req, res, next) {
    try {
      const { id } = req.params;
      await this.deleteMealPlanUseCase.execute(id);

      res
        .status(200)
        .json({ success: true, message: 'Meal plan deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/meal-plans/:id/confirm */
  async confirmMealPlan(req, res, next) {
    try {
      const { id } = req.params;
      const mealPlan = await this.confirmMealPlanUseCase.execute(id);
      const response = new MealPlanResponse(mealPlan);

      res.status(200).json({
        success: true,
        message: 'Meal plan confirmed successfully',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MealPlanController;

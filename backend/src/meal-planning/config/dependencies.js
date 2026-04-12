import MongoMealPlanRepository from '../infrastructure/repositories/MongoMealPlanRepository.js';

import CreateMealPlanUseCase from '../application/use-cases/meal-plan/CreateMealPlanUseCase.js';
import GetMealPlanUseCase from '../application/use-cases/meal-plan/GetMealPlanUseCase.js';
import GetSchoolMealPlansUseCase from '../application/use-cases/meal-plan/GetSchoolMealPlansUseCase.js';
import UpdateMealPlanUseCase from '../application/use-cases/meal-plan/UpdateMealPlanUseCase.js';
import DeleteMealPlanUseCase from '../application/use-cases/meal-plan/DeleteMealPlanUseCase.js';
import ConfirmMealPlanUseCase from '../application/use-cases/meal-plan/ConfirmMealPlanUseCase.js';

import MealPlanController from '../presentation/controllers/MealPlanController.js';

/** Wires infrastructure, use cases, and controllers into a single DI container. */
class DependencyContainer {
  constructor() {
    this.instances = {};
    this._initializeInfrastructure();
    this._initializeUseCases();
    this._initializeControllers();
  }

  _initializeInfrastructure() {
    this.instances.mealPlanRepository = new MongoMealPlanRepository();
  }

  _initializeUseCases() {
    this.instances.createMealPlanUseCase = new CreateMealPlanUseCase(
      this.instances.mealPlanRepository
    );

    this.instances.getMealPlanUseCase = new GetMealPlanUseCase(
      this.instances.mealPlanRepository
    );

    this.instances.getSchoolMealPlansUseCase = new GetSchoolMealPlansUseCase(
      this.instances.mealPlanRepository
    );

    this.instances.updateMealPlanUseCase = new UpdateMealPlanUseCase(
      this.instances.mealPlanRepository
    );

    this.instances.deleteMealPlanUseCase = new DeleteMealPlanUseCase(
      this.instances.mealPlanRepository
    );

    this.instances.confirmMealPlanUseCase = new ConfirmMealPlanUseCase(
      this.instances.mealPlanRepository
    );
  }

  _initializeControllers() {
    this.instances.mealPlanController = new MealPlanController({
      createMealPlanUseCase: this.instances.createMealPlanUseCase,
      getMealPlanUseCase: this.instances.getMealPlanUseCase,
      getSchoolMealPlansUseCase: this.instances.getSchoolMealPlansUseCase,
      updateMealPlanUseCase: this.instances.updateMealPlanUseCase,
      deleteMealPlanUseCase: this.instances.deleteMealPlanUseCase,
      confirmMealPlanUseCase: this.instances.confirmMealPlanUseCase,
    });
  }

  /** @throws {Error} if the requested dependency has not been registered */
  get(name) {
    if (!this.instances[name]) {
      throw new Error(`Dependency '${name}' not found`);
    }
    return this.instances[name];
  }
}

export default new DependencyContainer();

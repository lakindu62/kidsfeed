// Retrieves all meal plans for a given school
class GetSchoolMealPlansUseCase {
  constructor(mealPlanRepository) {
    this.mealPlanRepository = mealPlanRepository;
  }

  async execute(schoolId, filters = {}) {
    return await this.mealPlanRepository.findBySchoolId(schoolId, filters);
  }
}

export default GetSchoolMealPlansUseCase;

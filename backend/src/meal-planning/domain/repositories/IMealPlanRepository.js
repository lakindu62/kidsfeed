// Contract defining required methods for MealPlan repository implementations
class IMealPlanRepository {
  async save(_mealPlan) {
    throw new Error('Method save() must be implemented');
  }

  async findById(_id) {
    throw new Error('Method findById() must be implemented');
  }

  async findBySchoolId(_schoolId, _filters) {
    throw new Error('Method findBySchoolId() must be implemented');
  }

  async findByDateRange(_schoolId, _startDate, _endDate) {
    throw new Error('Method findByDateRange() must be implemented');
  }

  async update(_id, _mealPlan) {
    throw new Error('Method update() must be implemented');
  }

  async delete(_id) {
    throw new Error('Method delete() must be implemented');
  }

  async findCurrentWeek(_schoolId) {
    throw new Error('Method findCurrentWeek() must be implemented');
  }
}

export default IMealPlanRepository;

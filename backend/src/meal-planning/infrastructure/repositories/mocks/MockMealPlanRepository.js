import IMealPlanRepository from '../../../domain/repositories/IMealPlanRepository.js';

// In-memory meal plan repository for testing
class MockMealPlanRepository extends IMealPlanRepository {
  constructor() {
    super();
    this.mealPlans = [];
    this.nextId = 1;
  }

  async save(mealPlan) {
    const saved = { ...mealPlan, id: String(this.nextId++) };
    this.mealPlans.push(saved);
    return saved;
  }

  async findById(id) {
    return this.mealPlans.find((mp) => mp.id === id) || null;
  }

  async findBySchoolId(schoolId, filters = {}) {
    let filtered = this.mealPlans.filter((mp) => mp.schoolId === schoolId);

    if (filters.status) {
      filtered = filtered.filter((mp) => mp.status === filters.status);
    }

    return filtered;
  }

  async findByDateRange(schoolId, startDate, endDate) {
    return this.mealPlans.filter(
      (mp) =>
        mp.schoolId === schoolId &&
        mp.weekStartDate >= startDate &&
        mp.weekEndDate <= endDate
    );
  }

  async update(id, mealPlan) {
    const index = this.mealPlans.findIndex((mp) => mp.id === id);
    if (index === -1) {
      return null;
    }

    this.mealPlans[index] = { ...this.mealPlans[index], ...mealPlan, id };
    return this.mealPlans[index];
  }

  async delete(id) {
    const index = this.mealPlans.findIndex((mp) => mp.id === id);
    if (index === -1) {
      return null;
    }

    const deleted = this.mealPlans[index];
    this.mealPlans.splice(index, 1);
    return deleted;
  }

  // Returns the meal plan whose date range covers today
  async findCurrentWeek(schoolId) {
    const now = new Date();
    return (
      this.mealPlans.find(
        (mp) =>
          mp.schoolId === schoolId &&
          mp.weekStartDate <= now &&
          mp.weekEndDate >= now
      ) || null
    );
  }

  // Resets store between tests
  clear() {
    this.mealPlans = [];
    this.nextId = 1;
  }
}

export default MockMealPlanRepository;

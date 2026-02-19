import { MealSession } from '../schemas/meal-session.schema.js';

export class MealSessionRepository {
  async create(data) {
    return MealSession.create(data);
  }

  async findById(id) {
    return MealSession.findById(id);
  }

  async findMany(filter = {}) {
    return MealSession.find(filter).sort({ date: -1 });
  }

  async updateById(id, updates) {
    return MealSession.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteById(id) {
    return MealSession.findByIdAndDelete(id);
  }
}

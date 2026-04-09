import { MealGuardianNotification } from '../schemas/meal-guardian-notification.schema.js';

export class MealGuardianNotificationRepository {
  async create(data) {
    return MealGuardianNotification.create(data);
  }

  async findMany(filter = {}) {
    return MealGuardianNotification.find(filter).sort({ studentId: 1 }).lean();
  }

  async findBySessionId(mealSessionId) {
    return MealGuardianNotification.find({ mealSessionId })
      .sort({ studentId: 1 })
      .lean();
  }
}

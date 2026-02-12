import { MealAttendance } from "../schemas/meal-attendance.schema.js";

export class MealAttendanceRepository {
  async create(data) {
    return MealAttendance.create(data);
  }

  async findById(id) {
    return MealAttendance.findById(id);
  }

  async findMany(filter = {}) {
    return MealAttendance.find(filter).sort({ servedAt: -1 });
  }

  async updateById(id, updates) {
    return MealAttendance.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteById(id) {
    return MealAttendance.findByIdAndDelete(id);
  }
}


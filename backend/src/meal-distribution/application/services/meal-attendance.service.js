import { toMealAttendanceResponse } from '../dtos/responses/meal-attendance-response.dto.js';

export class MealAttendanceService {
  constructor(mealAttendanceRepository, mealSessionRepository) {
    this.mealAttendanceRepository = mealAttendanceRepository;
    this.mealSessionRepository = mealSessionRepository;
  }

  async markAttendance(dto) {
    const { studentId, mealSessionId } = dto;

    // Ensure the meal session exists before recording attendance
    const session = await this.mealSessionRepository.findById(mealSessionId);
    if (!session) {
      return { error: 'MEAL_SESSION_NOT_FOUND' };
    }

    const status = dto.status ? String(dto.status).trim() : 'PRESENT';

    const data = {
      studentId: String(studentId).trim(),
      mealSessionId,
      status,
      servedAt:
        dto.servedAt instanceof Date && !Number.isNaN(dto.servedAt.getTime())
          ? dto.servedAt
          : dto.servedAt
            ? new Date(dto.servedAt)
            : undefined,
      notes:
        dto.notes === undefined || dto.notes === null
          ? undefined
          : String(dto.notes).trim(),
    };

    const created = await this.mealAttendanceRepository.create(data);

    // Only bump counts when marking a PRESENT attendance
    if (status === 'PRESENT') {
      const newActualServedCount = (session.actualServedCount || 0) + 1;
      const newWastageCount = Math.max(
        (session.plannedHeadcount || 0) - newActualServedCount,
        0
      );

      await this.mealSessionRepository.updateById(mealSessionId, {
        actualServedCount: newActualServedCount,
        wastageCount: newWastageCount,
      });
    }

    return { attendance: toMealAttendanceResponse(created) };
  }

  async getAttendanceById(attendanceId) {
    const doc = await this.mealAttendanceRepository.findById(attendanceId);
    return toMealAttendanceResponse(doc);
  }

  async listAttendance(filters = {}) {
    const filter = {};
    if (filters.studentId) {
      filter.studentId = String(filters.studentId).trim();
    }
    if (filters.mealSessionId) {
      filter.mealSessionId = filters.mealSessionId;
    }
    if (filters.status) {
      filter.status = String(filters.status).trim();
    }
    if (filters.dateFrom || filters.dateTo) {
      filter.servedAt = {};
      if (filters.dateFrom) {
        filter.servedAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        filter.servedAt.$lte = new Date(filters.dateTo);
      }
    }

    const docs = await this.mealAttendanceRepository.findMany(filter);
    return docs.map(toMealAttendanceResponse);
  }

  async updateAttendance(/* attendanceId, updateAttendanceDto */) {}

  async deleteAttendance(/* attendanceId */) {}
}

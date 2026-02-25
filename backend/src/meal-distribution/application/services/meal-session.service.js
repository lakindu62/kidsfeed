import { toMealSessionResponse } from '../dtos/responses/meal-session-response.dto.js';
import { countStudentsBySchool } from '../../../school-management/infrastructure/repositories/student.repository.js';

export class MealSessionService {
  constructor(mealSessionRepository) {
    this.mealSessionRepository = mealSessionRepository;
  }

  async createMealSession(dto) {
    // Derive plannedHeadcount from school-management student data
    const plannedHeadcountValue = await countStudentsBySchool(dto.schoolId);
    const actualServedCountValue =
      dto.actualServedCount === undefined || dto.actualServedCount === null
        ? 0
        : Number(dto.actualServedCount);

    const data = {
      date: dto.date instanceof Date ? dto.date : new Date(dto.date),
      mealType: String(dto.mealType).trim(),
      schoolId: String(dto.schoolId).trim(),
      grade:
        dto.grade === undefined || dto.grade === null
          ? undefined
          : String(dto.grade).trim(),
      className:
        dto.className === undefined || dto.className === null
          ? undefined
          : String(dto.className).trim(),
      plannedHeadcount: plannedHeadcountValue,
      actualServedCount: actualServedCountValue,
      menuId:
        dto.menuId === undefined || dto.menuId === null
          ? undefined
          : String(dto.menuId).trim(),
      // status uses schema default ('PLANNED')
      // wastageCount is derived from plannedHeadcount - actualServedCount
      wastageCount: Math.max(plannedHeadcountValue - actualServedCountValue, 0),
      // Later: validate menuId/mealType/date against menu-management when that API exists
    };

    const created = await this.mealSessionRepository.create(data);
    return toMealSessionResponse(created);
  }

  async getMealSessionById(mealSessionId) {
    const session = await this.mealSessionRepository.findById(mealSessionId);
    return session ? toMealSessionResponse(session) : null;
  }

  async listMealSessions(filters = {}) {
    const filter = {};
    if (filters.schoolId) {
      filter.schoolId = String(filters.schoolId).trim();
    }
    if (filters.mealType) {
      filter.mealType = String(filters.mealType).trim();
    }
    if (filters.dateFrom || filters.dateTo) {
      filter.date = {};
      if (filters.dateFrom) {
        filter.date.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        filter.date.$lte = new Date(filters.dateTo);
      }
    } else if (filters.date) {
      filter.date = new Date(filters.date);
    }

    const sessions = await this.mealSessionRepository.findMany(filter);
    return sessions.map(toMealSessionResponse);
  }

  async updateMealSession(mealSessionId, dto) {
    const session = await this.mealSessionRepository.findById(mealSessionId);
    if (!session) {
      return null;
    }

    const updates = {};
    if (dto.date !== undefined && dto.date !== null) {
      updates.date = dto.date instanceof Date ? dto.date : new Date(dto.date);
    }
    if (dto.mealType !== undefined && dto.mealType !== null) {
      updates.mealType = String(dto.mealType).trim();
    }
    if (dto.grade !== undefined && dto.grade !== null) {
      updates.grade = String(dto.grade).trim();
    }
    if (dto.className !== undefined && dto.className !== null) {
      updates.className = String(dto.className).trim();
    }
    if (dto.plannedHeadcount !== undefined && dto.plannedHeadcount !== null) {
      updates.plannedHeadcount = Number(dto.plannedHeadcount);
    }
    if (dto.actualServedCount !== undefined && dto.actualServedCount !== null) {
      updates.actualServedCount = Number(dto.actualServedCount);
    }
    if (dto.status !== undefined && dto.status !== null) {
      updates.status = String(dto.status).trim();
    }

    if (Object.keys(updates).length === 0) {
      return toMealSessionResponse(session);
    }

    if (
      updates.plannedHeadcount !== undefined ||
      updates.actualServedCount !== undefined
    ) {
      const planned =
        updates.plannedHeadcount !== undefined
          ? updates.plannedHeadcount
          : session.plannedHeadcount;
      const actual =
        updates.actualServedCount !== undefined
          ? updates.actualServedCount
          : session.actualServedCount;
      updates.wastageCount = Math.max(planned - actual, 0);
    }

    const updated = await this.mealSessionRepository.updateById(
      mealSessionId,
      updates
    );
    return toMealSessionResponse(updated);
  }

  async deleteMealSession(mealSessionId) {
    const deleted = await this.mealSessionRepository.deleteById(mealSessionId);
    return Boolean(deleted);
  }
}

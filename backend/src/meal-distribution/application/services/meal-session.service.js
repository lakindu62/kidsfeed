import { toMealSessionResponse } from '../dtos/responses/meal-session-response.dto.js';

export class MealSessionService {
  constructor(mealSessionRepository) {
    this.mealSessionRepository = mealSessionRepository;
  }

  async createMealSession(dto) {
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
      plannedHeadcount:
        dto.plannedHeadcount === undefined || dto.plannedHeadcount === null
          ? 0
          : Number(dto.plannedHeadcount),
      menuId:
        dto.menuId === undefined || dto.menuId === null
          ? undefined
          : String(dto.menuId).trim(),
      // actualServedCount, wastageCount, status use schema defaults (0, 0, 'PLANNED')
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
    if (filters.schoolId) {filter.schoolId = String(filters.schoolId).trim();}
    if (filters.mealType) {filter.mealType = String(filters.mealType).trim();}
    if (filters.dateFrom || filters.dateTo) {
      filter.date = {};
      if (filters.dateFrom) {filter.date.$gte = new Date(filters.dateFrom);}
      if (filters.dateTo) {filter.date.$lte = new Date(filters.dateTo);}
    } else if (filters.date) {
      filter.date = new Date(filters.date);
    }

    const sessions = await this.mealSessionRepository.findMany(filter);
    return sessions.map(toMealSessionResponse);
  }

  async updateMealSession(/* mealSessionId, updateMealSessionDto */) {}

  async deleteMealSession(/* mealSessionId */) {}
}

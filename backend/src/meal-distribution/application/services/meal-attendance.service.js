// Application service for per-student meal attendance.
// - Records and queries attendance for a given meal session.
// - Keeps the parent MealSession's actualServedCount and wastageCount
//   in sync whenever attendance is created, updated or deleted.
import { MarkAttendanceDto } from '../dtos/requests/mark-attendance.dto.js';
import { toMealAttendanceResponse } from '../dtos/responses/meal-attendance-response.dto.js';
import {
  findActiveStudentsWithGuardianForMealSession,
  isActiveStudentInSchool,
} from '../../infrastructure/services/meal-student-lookup.service.js';
import { pickLatestAttendanceByStudentId } from '../../infrastructure/utils/latest-attendance-by-student.util.js';

export class MealAttendanceService {
  constructor(mealAttendanceRepository, mealSessionRepository) {
    this.mealAttendanceRepository = mealAttendanceRepository;
    this.mealSessionRepository = mealSessionRepository;
  }

  async promoteSessionToInProgressIfNeeded(session, nextAttendanceStatus) {
    if (!session) {
      return;
    }
    const sessionStatus = String(session.status || 'PLANNED').toUpperCase();
    const attendanceStatus = String(nextAttendanceStatus || '').toUpperCase();
    const shouldPromote =
      sessionStatus === 'PLANNED' &&
      (attendanceStatus === 'PRESENT' || attendanceStatus === 'EXCUSED');

    if (shouldPromote) {
      await this.mealSessionRepository.updateById(session._id, {
        status: 'IN_PROGRESS',
      });
    }
  }

  isSessionCompleted(session) {
    return String(session?.status || '').toUpperCase() === 'COMPLETED';
  }

  async markAttendance(dto) {
    const { studentId, mealSessionId } = dto;

    // Ensure the meal session exists before recording attendance
    const session = await this.mealSessionRepository.findById(mealSessionId);
    if (!session) {
      return { error: 'MEAL_SESSION_NOT_FOUND' };
    }
    if (this.isSessionCompleted(session)) {
      return { error: 'MEAL_SESSION_COMPLETED' };
    }

    const normalizedStudentId = String(studentId).trim();
    const inSchool = await isActiveStudentInSchool(
      normalizedStudentId,
      session.schoolId
    );
    if (!inSchool) {
      return { error: 'STUDENT_NOT_IN_SCHOOL' };
    }

    const status = dto.status ? String(dto.status).trim() : 'PRESENT';

    const rowsForStudent = await this.mealAttendanceRepository.findMany({
      mealSessionId,
      studentId: normalizedStudentId,
    });
    const bySid = pickLatestAttendanceByStudentId(rowsForStudent);
    const existing = bySid.get(normalizedStudentId);

    if (existing) {
      if (
        String(existing.status || '').toUpperCase() === 'PRESENT' &&
        String(status).toUpperCase() === 'PRESENT'
      ) {
        return { error: 'STUDENT_ALREADY_PRESENT' };
      }

      const updateDto = new MarkAttendanceDto({
        studentId: normalizedStudentId,
        mealSessionId,
        status,
        servedAt:
          dto.servedAt instanceof Date && !Number.isNaN(dto.servedAt.getTime())
            ? dto.servedAt
            : dto.servedAt
              ? new Date(dto.servedAt)
              : new Date(),
        notes: dto.notes,
      });
      const updated = await this.updateAttendance(
        existing._id.toString(),
        updateDto
      );
      if (updated.notFound) {
        return { error: 'MEAL_SESSION_NOT_FOUND' };
      }
      if (updated.error) {
        return { error: updated.error };
      }
      return { attendance: updated.attendance };
    }

    const data = {
      studentId: normalizedStudentId,
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

    await this.promoteSessionToInProgressIfNeeded(session, status);

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

  async listSessionRoster(mealSessionId) {
    const session = await this.mealSessionRepository.findById(mealSessionId);
    if (!session) {
      return { error: 'MEAL_SESSION_NOT_FOUND' };
    }
    const isCompleted = this.isSessionCompleted(session);

    const [students, attendanceDocs] = await Promise.all([
      findActiveStudentsWithGuardianForMealSession(session.schoolId),
      this.mealAttendanceRepository.findMany({ mealSessionId }),
    ]);

    const attendanceByStudentId =
      pickLatestAttendanceByStudentId(attendanceDocs);

    const roster = students
      .map((student) => {
        const sid = String(student.studentId);
        const attendance = attendanceByStudentId.get(sid);
        return {
          studentId: sid,
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          fullName: [student.firstName, student.lastName]
            .filter(Boolean)
            .join(' ')
            .trim(),
          status:
            attendance?.status || (isCompleted ? 'NO_SHOW' : 'NOT_MARKED'),
          servedAt: attendance?.servedAt || null,
          attendanceId: attendance?._id?.toString?.() || null,
        };
      })
      .sort((a, b) => String(a.studentId).localeCompare(String(b.studentId)));

    return { roster };
  }

  async updateAttendance(attendanceId, dto) {
    const existing = await this.mealAttendanceRepository.findById(attendanceId);
    if (!existing) {
      return { notFound: true };
    }

    const session = await this.mealSessionRepository.findById(
      existing.mealSessionId
    );
    if (this.isSessionCompleted(session)) {
      return { error: 'MEAL_SESSION_COMPLETED' };
    }

    const updates = {};
    if (dto.status !== undefined && dto.status !== null) {
      updates.status = String(dto.status).trim();
    }
    if (dto.servedAt !== undefined && dto.servedAt !== null) {
      updates.servedAt =
        dto.servedAt instanceof Date && !Number.isNaN(dto.servedAt.getTime())
          ? dto.servedAt
          : new Date(dto.servedAt);
    }
    if (dto.notes !== undefined && dto.notes !== null) {
      updates.notes = String(dto.notes).trim();
    }

    if (Object.keys(updates).length === 0) {
      return { attendance: toMealAttendanceResponse(existing) };
    }

    const originalStatus = existing.status;
    const newStatus = updates.status || originalStatus;

    const updated = await this.mealAttendanceRepository.updateById(
      attendanceId,
      updates
    );

    // Adjust session counts if status changed with respect to PRESENT
    if (originalStatus !== newStatus) {
      let delta = 0;
      if (originalStatus !== 'PRESENT' && newStatus === 'PRESENT') {
        delta = 1;
      } else if (originalStatus === 'PRESENT' && newStatus !== 'PRESENT') {
        delta = -1;
      }

      if (delta !== 0) {
        const sessionForCount = await this.mealSessionRepository.findById(
          existing.mealSessionId
        );
        if (sessionForCount) {
          await this.promoteSessionToInProgressIfNeeded(
            sessionForCount,
            newStatus
          );
          const newActualServedCount = Math.max(
            (sessionForCount.actualServedCount || 0) + delta,
            0
          );
          const newWastageCount = Math.max(
            (sessionForCount.plannedHeadcount || 0) - newActualServedCount,
            0
          );
          await this.mealSessionRepository.updateById(existing.mealSessionId, {
            actualServedCount: newActualServedCount,
            wastageCount: newWastageCount,
          });
        }
      }
    } else if (newStatus === 'EXCUSED') {
      const session = await this.mealSessionRepository.findById(
        existing.mealSessionId
      );
      await this.promoteSessionToInProgressIfNeeded(session, newStatus);
    }

    return { attendance: toMealAttendanceResponse(updated) };
  }

  async deleteAttendance(attendanceId) {
    const existing = await this.mealAttendanceRepository.findById(attendanceId);
    if (!existing) {
      return { notFound: true };
    }

    const session = await this.mealSessionRepository.findById(
      existing.mealSessionId
    );
    if (this.isSessionCompleted(session)) {
      return { error: 'MEAL_SESSION_COMPLETED' };
    }

    // If this attendance was PRESENT, decrement session counts before deleting
    if (existing.status === 'PRESENT') {
      const session = await this.mealSessionRepository.findById(
        existing.mealSessionId
      );
      if (session) {
        const newActualServedCount = Math.max(
          (session.actualServedCount || 0) - 1,
          0
        );
        const newWastageCount = Math.max(
          (session.plannedHeadcount || 0) - newActualServedCount,
          0
        );
        await this.mealSessionRepository.updateById(existing.mealSessionId, {
          actualServedCount: newActualServedCount,
          wastageCount: newWastageCount,
        });
      }
    }

    await this.mealAttendanceRepository.deleteById(attendanceId);
    return { deleted: true };
  }
}

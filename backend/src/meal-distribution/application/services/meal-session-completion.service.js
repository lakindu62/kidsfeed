import { MealAttendance } from '../../infrastructure/schemas/meal-attendance.schema.js';
import { findActiveStudentsWithGuardianForMealSession } from '../../infrastructure/services/meal-student-lookup.service.js';
import { pickLatestAttendanceByStudentId } from '../../infrastructure/utils/latest-attendance-by-student.util.js';
import { findSchoolById } from '../../../school-management/infrastructure/repositories/school.repository.js';

function formatSessionDateForEmail(date) {
  if (!date) {
    return '';
  }
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString().slice(0, 10);
}

export class MealSessionCompletionService {
  constructor({
    mealAttendanceRepository,
    mealGuardianNotificationRepository,
    notificationService,
  }) {
    this.mealAttendanceRepository = mealAttendanceRepository;
    this.mealGuardianNotificationRepository =
      mealGuardianNotificationRepository;
    this.notificationService = notificationService;
  }

  async safeCreateNotificationLog(payload) {
    try {
      await this.mealGuardianNotificationRepository.create(payload);
    } catch (err) {
      if (err?.code === 11000) {
        return;
      }
      throw err;
    }
  }

  /**
   * When a session becomes COMPLETED: backfill NO_SHOW for expected students not PRESENT,
   * send guardian emails where possible, persist audit rows (idempotent per session+student).
   */
  async finalizeOnSessionCompleted(mealSessionDoc) {
    if (!mealSessionDoc) {
      return;
    }
    if (mealSessionDoc.guardianNotificationsCompletedAt) {
      return;
    }

    const mealSessionId = mealSessionDoc._id;
    const schoolId = mealSessionDoc.schoolId;
    const mealType = mealSessionDoc.mealType || 'meal';
    const sessionDateLabel = formatSessionDateForEmail(mealSessionDoc.date);
    const schoolDoc = await findSchoolById(schoolId);
    const schoolLabel =
      (schoolDoc?.schoolName && String(schoolDoc.schoolName).trim()) ||
      String(schoolId);

    const students =
      await findActiveStudentsWithGuardianForMealSession(schoolId);
    const attendanceDocs = await this.mealAttendanceRepository.findMany({
      mealSessionId,
    });
    const byStudentId = pickLatestAttendanceByStudentId(attendanceDocs);

    for (const student of students) {
      const sid = String(student.studentId);
      const existing = byStudentId.get(sid);
      const displayName =
        [student.firstName, student.lastName].filter(Boolean).join(' ') || sid;

      if (existing?.status === 'PRESENT' || existing?.status === 'EXCUSED') {
        continue;
      }

      if (!existing) {
        await MealAttendance.create({
          studentId: sid,
          mealSessionId,
          status: 'NO_SHOW',
          servedAt: new Date(),
        });
      }

      const email = String(student.guardian?.email || '').trim();
      if (!email) {
        await this.safeCreateNotificationLog({
          mealSessionId,
          studentId: sid,
          status: 'SKIPPED',
          skipReason: 'MISSING_EMAIL',
        });
        continue;
      }

      const sendResult = await this.notificationService.sendGuardianNoShowEmail(
        {
          to: email,
          studentDisplayName: displayName,
          mealType,
          sessionDate: sessionDateLabel,
          schoolLabel,
        }
      );

      if (!sendResult.ok) {
        await this.safeCreateNotificationLog({
          mealSessionId,
          studentId: sid,
          guardianEmail: email,
          status:
            sendResult.code === 'NO_EMAIL_PROVIDER' ? 'SKIPPED' : 'FAILED',
          skipReason:
            sendResult.code === 'NO_EMAIL_PROVIDER'
              ? 'NO_EMAIL_PROVIDER'
              : undefined,
          errorMessage: sendResult.message || sendResult.code || 'Send failed',
        });
        continue;
      }

      await this.safeCreateNotificationLog({
        mealSessionId,
        studentId: sid,
        guardianEmail: email,
        status: 'SENT',
        providerMessageId: sendResult.messageId,
        sentAt: new Date(),
      });
    }
  }
}

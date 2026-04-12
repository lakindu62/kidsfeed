import { MealAttendance } from '../../infrastructure/schemas/meal-attendance.schema.js';
import { MealGuardianNotification } from '../../infrastructure/schemas/meal-guardian-notification.schema.js';
import { MealSession } from '../../infrastructure/schemas/meal-session.schema.js';
import Student from '../../../school-management/infrastructure/schemas/student.schema.js';

function notifyKey(mealSessionId, studentId) {
  return `${mealSessionId.toString()}:${String(studentId)}`;
}

/**
 * Aggregates NO_SHOW attendance for the school’s meal sessions in an optional date range,
 * with guardian email (from Student schema) and guardian email audit (if session was finalized).
 */
export async function listNoShowAlertsForSchool({
  schoolId,
  dateFrom,
  dateTo,
}) {
  const sid = String(schoolId).trim();
  const sessionQuery = { schoolId: sid };

  if (dateFrom || dateTo) {
    sessionQuery.date = {};
    if (dateFrom) {
      sessionQuery.date.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      sessionQuery.date.$lte = new Date(dateTo);
    }
  }

  const sessions = await MealSession.find(sessionQuery)
    .sort({ date: -1 })
    .lean();

  if (sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((s) => s._id);
  const sessionById = new Map(sessions.map((s) => [s._id.toString(), s]));

  const attendances = await MealAttendance.find({
    mealSessionId: { $in: sessionIds },
    status: 'NO_SHOW',
  }).lean();

  if (attendances.length === 0) {
    return [];
  }

  const notifications = await MealGuardianNotification.find({
    mealSessionId: { $in: sessionIds },
  }).lean();

  const notifyMap = new Map(
    notifications.map((n) => [notifyKey(n.mealSessionId, n.studentId), n])
  );

  const uniqueStudentIds = [
    ...new Set(attendances.map((a) => String(a.studentId))),
  ];

  const students = await Student.find({
    studentId: { $in: uniqueStudentIds },
  })
    .select('studentId guardian')
    .lean();

  const guardianByStudentId = new Map(
    students.map((s) => [s.studentId, s.guardian?.email?.trim() || ''])
  );

  const items = attendances.map((a) => {
    const session = sessionById.get(a.mealSessionId.toString());
    const n = notifyMap.get(notifyKey(a.mealSessionId, a.studentId));
    const g = guardianByStudentId.get(String(a.studentId));

    return {
      attendanceId: a._id.toString(),
      studentId: a.studentId,
      mealSessionId: a.mealSessionId.toString(),
      sessionDate: session?.date ?? null,
      mealType: session?.mealType ?? null,
      attendanceStatus: a.status,
      sessionStatus: session?.status ?? null,
      guardianEmail: g || null,
      emailLogStatus: n?.status ?? null,
      emailLogSkipReason: n?.skipReason ?? null,
      emailSentAt: n?.sentAt ?? null,
    };
  });

  items.sort((x, y) => {
    const dx = new Date(x.sessionDate || 0).getTime();
    const dy = new Date(y.sessionDate || 0).getTime();
    if (dy !== dx) {
      return dy - dx;
    }
    return String(x.studentId).localeCompare(String(y.studentId));
  });

  return items;
}

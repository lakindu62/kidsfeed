import { MealAttendance } from '../../infrastructure/schemas/meal-attendance.schema.js';
import { MealSession } from '../../infrastructure/schemas/meal-session.schema.js';
import Student from '../../../school-management/infrastructure/schemas/student.schema.js';

export async function listStudentMealHistory({
  schoolId,
  studentId,
  dateFrom,
  dateTo,
  mealType,
  attendanceStatus,
}) {
  const sid = String(schoolId || '').trim();
  const studentIdValue = String(studentId || '').trim();
  if (!sid || !studentIdValue) {
    return [];
  }

  const student = await Student.findOne({ studentId: studentIdValue })
    .select('studentId firstName lastName')
    .lean();

  const attendanceQuery = { studentId: studentIdValue };
  if (attendanceStatus) {
    attendanceQuery.status = String(attendanceStatus).trim().toUpperCase();
  }

  const attendances = await MealAttendance.find(attendanceQuery).lean();
  if (attendances.length === 0) {
    return [];
  }

  const sessionIds = attendances.map((row) => row.mealSessionId);
  const sessionQuery = {
    _id: { $in: sessionIds },
    schoolId: sid,
  };

  if (mealType) {
    sessionQuery.mealType = String(mealType).trim().toUpperCase();
  }
  if (dateFrom || dateTo) {
    sessionQuery.date = {};
    if (dateFrom) {
      sessionQuery.date.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      sessionQuery.date.$lte = new Date(dateTo);
    }
  }

  const sessions = await MealSession.find(sessionQuery).lean();
  const sessionById = new Map(sessions.map((s) => [s._id.toString(), s]));

  const rows = attendances
    .map((attendance) => {
      const session = sessionById.get(String(attendance.mealSessionId));
      if (!session) {
        return null;
      }

      return {
        attendanceId: attendance._id?.toString?.() || null,
        studentId: studentIdValue,
        studentName: [student?.firstName, student?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim(),
        mealSessionId: session._id?.toString?.() || null,
        sessionDate: session.date || null,
        mealType: session.mealType || null,
        sessionStatus: session.status || null,
        attendanceStatus: attendance.status || null,
        servedAt: attendance.servedAt || null,
      };
    })
    .filter(Boolean);

  rows.sort((a, b) => {
    const ta = new Date(a.sessionDate || 0).getTime();
    const tb = new Date(b.sessionDate || 0).getTime();
    return tb - ta;
  });

  return rows;
}

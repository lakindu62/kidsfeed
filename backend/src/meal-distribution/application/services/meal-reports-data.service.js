import { MealSession } from '../../infrastructure/schemas/meal-session.schema.js';
import { MealAttendance } from '../../infrastructure/schemas/meal-attendance.schema.js';
import { listNoShowAlertsForSchool } from './no-show-alerts-list.service.js';
import Student from '../../../school-management/infrastructure/schemas/student.schema.js';

function sessionDateFilter(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) {
    return null;
  }
  const range = {};
  if (dateFrom) {
    range.$gte = new Date(dateFrom);
  }
  if (dateTo) {
    range.$lte = new Date(dateTo);
  }
  return range;
}

/**
 * Meal sessions for a school with attendance counts (PRESENT / EXCUSED / NO_SHOW).
 */
export async function listSessionSummariesForSchool({
  schoolId,
  dateFrom,
  dateTo,
}) {
  const sid = String(schoolId).trim();
  const sessionQuery = { schoolId: sid };
  const dr = sessionDateFilter(dateFrom, dateTo);
  if (dr) {
    sessionQuery.date = dr;
  }

  const sessions = await MealSession.find(sessionQuery)
    .sort({ date: -1 })
    .lean();
  if (sessions.length === 0) {
    return [];
  }

  const ids = sessions.map((s) => s._id);
  const agg = await MealAttendance.aggregate([
    { $match: { mealSessionId: { $in: ids } } },
    {
      $group: {
        _id: '$mealSessionId',
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
        },
        excused: {
          $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] },
        },
        noShow: {
          $sum: { $cond: [{ $eq: ['$status', 'NO_SHOW'] }, 1, 0] },
        },
      },
    },
  ]);

  const bySession = new Map(agg.map((r) => [r._id.toString(), r]));

  return sessions.map((s) => {
    const c = bySession.get(s._id.toString()) || {
      present: 0,
      excused: 0,
      noShow: 0,
    };
    return {
      sessionId: s._id.toString(),
      date: s.date,
      mealType: s.mealType,
      status: s.status,
      plannedHeadcount: s.plannedHeadcount ?? 0,
      actualServedCount: s.actualServedCount ?? 0,
      present: c.present,
      excused: c.excused,
      noShow: c.noShow,
    };
  });
}

/**
 * No-show rows with student display name for reports.
 */
export async function listNoShowReportRows({ schoolId, dateFrom, dateTo }) {
  const items = await listNoShowAlertsForSchool({
    schoolId,
    dateFrom,
    dateTo,
  });
  if (items.length === 0) {
    return [];
  }

  const ids = [...new Set(items.map((i) => String(i.studentId)))];
  const students = await Student.find({ studentId: { $in: ids } })
    .select('studentId firstName lastName')
    .lean();

  const nameBy = new Map(
    students.map((s) => [
      s.studentId,
      [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || s.studentId,
    ])
  );

  return items.map((row) => ({
    ...row,
    studentName: nameBy.get(String(row.studentId)) || String(row.studentId),
  }));
}

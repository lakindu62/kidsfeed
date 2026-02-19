export function toMealAttendanceResponse(attendanceDoc) {
  if (!attendanceDoc) {
    return null;
  }

  return {
    id: attendanceDoc._id?.toString?.() ?? null,
    studentId: attendanceDoc.studentId,
    mealSessionId: attendanceDoc.mealSessionId,
    status: attendanceDoc.status,
    servedAt: attendanceDoc.servedAt,
    notes: attendanceDoc.notes,
  };
}

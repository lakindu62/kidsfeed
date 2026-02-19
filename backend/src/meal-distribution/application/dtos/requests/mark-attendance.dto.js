export class MarkAttendanceDto {
  constructor({ studentId, mealSessionId, status, servedAt, notes }) {
    this.studentId = studentId;
    this.mealSessionId = mealSessionId;
    this.status = status;
    this.servedAt = servedAt;
    this.notes = notes;
  }
}

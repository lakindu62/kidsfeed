/**
 * Meal-distribution only: reads students for a school using the existing
 * school-management Student model (guardian.email, etc.). Does not modify
 * school-management source files.
 */
import mongoose from 'mongoose';
import Student from '../../../school-management/infrastructure/schemas/student.schema.js';

export function buildSchoolMatchForMealSession(schoolId) {
  const s = String(schoolId).trim();
  if (
    mongoose.Types.ObjectId.isValid(s) &&
    new mongoose.Types.ObjectId(s).toString() === s
  ) {
    return { school: new mongoose.Types.ObjectId(s) };
  }
  return { school: s };
}

export async function findActiveStudentsWithGuardianForMealSession(schoolId) {
  const match = buildSchoolMatchForMealSession(schoolId);
  return Student.find({ ...match, status: 'active' })
    .select('studentId firstName lastName guardian')
    .lean();
}

/**
 * True if an active student with this business studentId belongs to the school.
 */
export async function isActiveStudentInSchool(studentId, schoolId) {
  const match = buildSchoolMatchForMealSession(schoolId);
  const doc = await Student.findOne({
    ...match,
    status: 'active',
    studentId: String(studentId).trim(),
  })
    .select('_id')
    .lean();
  return Boolean(doc);
}

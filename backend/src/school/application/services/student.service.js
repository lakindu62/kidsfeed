import { findByStudentId } from '../../infrastructure/repositories/student.repository.js';
import { toStudentResponse } from '../dtos/responses/student-response.dto.js';

const getStudentProfile = async (studentId) => {
  const student = await findByStudentId(studentId);

  if (!student) {
    throw { status: 404, message: 'Student not found' };
  }

  return toStudentResponse(student);
};

export { getStudentProfile };

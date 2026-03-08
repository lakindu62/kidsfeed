import { searchStudents } from '../../infrastructure/repositories/student.repository.js';
import School from '../../infrastructure/schemas/school.schema.js';
import { toStudentResponse } from '../dtos/responses/student-response.dto.js';
import { AppError } from '../errors/app-error.js';

const globalSearch = async (q) => {
  if (!q || q.trim() === '') {
    throw new AppError(400, 'Search query is required');
  }

  const regex = new RegExp(q.trim(), 'i');

  const [students, schools] = await Promise.all([
    searchStudents(q),
    School.find({ schoolName: regex }).limit(10).lean(),
  ]);

  return {
    students: students.map(toStudentResponse),
    schools: schools.map((s) => ({
      id: s._id,
      schoolName: s.schoolName,
      districtNumber: s.districtNumber,
      region: s.region,
    })),
  };
};

export { globalSearch };

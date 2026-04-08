import {
  createStudent,
  findStudentById,
  findStudentsBySchool,
  updateStudentById,
  deleteStudentById,
  findByStudentId,
} from '../../infrastructure/repositories/student.repository.js';
import { findSchoolById } from '../../infrastructure/repositories/school.repository.js';
import { toCreateStudentData } from '../dtos/requests/create-student.dto.js';
import { toUpdateStudentData } from '../dtos/requests/update-student.dto.js';
import { toStudentQueryParams } from '../dtos/requests/student-query.dto.js';
import { toStudentResponse } from '../dtos/responses/student-response.dto.js';
import { toStudentListResponse } from '../dtos/responses/student-list-response.dto.js';
import { AppError } from '../errors/app-error.js';

const createStudentForSchool = async (schoolId, body) => {
  const school = await findSchoolById(schoolId);
  if (!school) {
    throw new AppError(404, 'School not found');
  }

  const existing = await findByStudentId(body.studentId);
  if (existing) {
    throw new AppError(409, 'Student ID already exists');
  }

  const data = toCreateStudentData(body, schoolId);
  const student = await createStudent(data);
  return toStudentResponse(student);
};

const listStudentsForSchool = async (schoolId, rawQuery) => {
  const school = await findSchoolById(schoolId);
  if (!school) {
    throw new AppError(404, 'School not found');
  }

  const { page, limit, search, grade } = toStudentQueryParams(rawQuery);
  const { data, total } = await findStudentsBySchool(schoolId, {
    page,
    limit,
    search,
    grade,
  });
  return toStudentListResponse(data, total, page, limit);
};

const getStudent = async (id) => {
  const student = await findStudentById(id);
  if (!student) {
    throw new AppError(404, 'Student not found');
  }
  return toStudentResponse(student);
};

const updateStudent = async (id, body) => {
  const data = toUpdateStudentData(body);
  const student = await updateStudentById(id, data);
  if (!student) {
    throw new AppError(404, 'Student not found');
  }
  return toStudentResponse(student);
};

const deleteStudent = async (id) => {
  const student = await deleteStudentById(id);
  if (!student) {
    throw new AppError(404, 'Student not found');
  }
};

export {
  createStudentForSchool,
  listStudentsForSchool,
  getStudent,
  updateStudent,
  deleteStudent,
};

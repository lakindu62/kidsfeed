import {
  createSchool,
  findAllSchools,
  findSchoolById,
  updateSchoolById,
  deleteSchoolById,
} from '../../infrastructure/repositories/school.repository.js';
import { toCreateSchoolData } from '../dtos/requests/create-school.dto.js';
import { toUpdateSchoolData } from '../dtos/requests/update-school.dto.js';
import { toSchoolResponse } from '../dtos/responses/school-response.dto.js';
import { AppError } from '../errors/app-error.js';

const createNewSchool = async (body) => {
  const data = toCreateSchoolData(body);
  const school = await createSchool(data);
  return toSchoolResponse(school);
};

const getAllSchools = async () => {
  const schools = await findAllSchools();
  return schools.map(toSchoolResponse);
};

const getSchoolById = async (id) => {
  const school = await findSchoolById(id);
  if (!school) throw new AppError(404, 'School not found');
  return toSchoolResponse(school);
};

const updateSchool = async (id, body) => {
  const data = toUpdateSchoolData(body);
  const school = await updateSchoolById(id, data);
  if (!school) throw new AppError(404, 'School not found');
  return toSchoolResponse(school);
};

const deleteSchool = async (id) => {
  const school = await deleteSchoolById(id);
  if (!school) throw new AppError(404, 'School not found');
};

export { createNewSchool, getAllSchools, getSchoolById, updateSchool, deleteSchool };

import { updateStudentById, findStudentById } from '../../infrastructure/repositories/student.repository.js';
import { toStudentResponse } from '../dtos/responses/student-response.dto.js';
import { AppError } from '../errors/app-error.js';

const updateDietaryProfile = async (id, body) => {
  const student = await findStudentById(id);
  if (!student) throw new AppError(404, 'Student not found');

  const data = {};
  if (body.dietaryTags !== undefined) data.dietaryTags = body.dietaryTags;
  if (body.kitchenNotes !== undefined) data.kitchenNotes = body.kitchenNotes;

  const updated = await updateStudentById(id, data);
  return toStudentResponse(updated);
};

export { updateDietaryProfile };

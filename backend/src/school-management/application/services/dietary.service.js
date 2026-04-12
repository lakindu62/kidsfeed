import {
  updateStudentById,
  findStudentById,
} from '../../infrastructure/repositories/student.repository.js';
import { toStudentResponse } from '../dtos/responses/student-response.dto.js';
import { AppError } from '../errors/app-error.js';
import { sendGuardianSms } from '../../infrastructure/services/twilio.service.js';

const ELIGIBILITY_LABELS = {
  eligible: 'eligible for free/reduced meals',
  'not-eligible': 'not eligible for free/reduced meals',
  pending: 'pending eligibility review',
};

const updateDietaryProfile = async (id, body) => {
  const student = await findStudentById(id);
  if (!student) {
    throw new AppError(404, 'Student not found');
  }

  const data = {};
  if (body.dietaryTags !== undefined) {
    data.dietaryTags = body.dietaryTags;
  }
  if (body.kitchenNotes !== undefined) {
    data.kitchenNotes = body.kitchenNotes;
  }

  const updated = await updateStudentById(id, data);

  if (
    body.dietaryTags !== undefined &&
    !student.guardian?.smsOptOut &&
    student.guardian?.phone
  ) {
    const name = `${student.firstName} ${student.lastName}`;
    const tags =
      body.dietaryTags.length > 0 ? body.dietaryTags.join(', ') : 'none';
    await sendGuardianSms(
      student.guardian.phone,
      `KidsFeed: Dietary tags for ${name} have been updated. Current tags: ${tags}. Contact your school if you have questions.`
    );
  }

  return toStudentResponse(updated);
};

const updateMealEligibility = async (id, status) => {
  const VALID = ['eligible', 'not-eligible', 'pending'];
  if (!VALID.includes(status)) {
    throw new AppError(400, `Status must be one of: ${VALID.join(', ')}`);
  }

  const student = await findStudentById(id);
  if (!student) {
    throw new AppError(404, 'Student not found');
  }

  const previousStatus = student.mealEligibilityStatus;
  const updated = await updateStudentById(id, {
    mealEligibilityStatus: status,
  });

  if (
    previousStatus !== status &&
    !student.guardian?.smsOptOut &&
    student.guardian?.phone
  ) {
    const name = `${student.firstName} ${student.lastName}`;
    await sendGuardianSms(
      student.guardian.phone,
      `KidsFeed: The meal eligibility status for ${name} has been updated to: ${ELIGIBILITY_LABELS[status]}. Contact your school for more information.`
    );
  }

  return toStudentResponse(updated);
};

export { updateDietaryProfile, updateMealEligibility };

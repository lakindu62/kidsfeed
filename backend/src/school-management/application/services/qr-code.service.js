import {
  findStudentById,
  updateStudentById,
  findStudentsBySchoolForQr,
} from '../../infrastructure/repositories/student.repository.js';
import { findSchoolById } from '../../infrastructure/repositories/school.repository.js';
import { generateQRCodeBase64 } from '../../infrastructure/services/qr-code-generator.service.js';
import { toStudentResponse } from '../dtos/responses/student-response.dto.js';
import { toMealCardResponse } from '../dtos/responses/meal-card-response.dto.js';
import { AppError } from '../errors/app-error.js';
import { sendGuardianSms } from '../../infrastructure/services/twilio.service.js';

const generateStudentQR = async (studentId) => {
  const student = await findStudentById(studentId);
  if (!student) {
    throw new AppError(404, 'Student not found');
  }

  const qrPayload = JSON.stringify({
    studentId: student.studentId,
    name: `${student.firstName} ${student.lastName}`,
    grade: student.gradeLevel,
  });

  const qrCode = await generateQRCodeBase64(qrPayload);
  const updated = await updateStudentById(studentId, {
    qrCode,
    qrGeneratedAt: new Date(),
    qrStatus: 'pending',
  });

  return toStudentResponse(updated);
};

const batchGenerateQR = async (schoolId, filters = {}) => {
  const school = await findSchoolById(schoolId);
  if (!school) {
    throw new AppError(404, 'School not found');
  }

  const students = await findStudentsBySchoolForQr(schoolId, filters);

  const results = await Promise.allSettled(
    students.map(async (student) => {
      const qrPayload = JSON.stringify({
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        grade: student.gradeLevel,
      });
      const qrCode = await generateQRCodeBase64(qrPayload);
      return updateStudentById(student._id, {
        qrCode,
        qrGeneratedAt: new Date(),
        qrStatus: 'pending',
      });
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { total: students.length, generated: successful, failed };
};

const listQRCards = async (schoolId, rawQuery = {}) => {
  const school = await findSchoolById(schoolId);
  if (!school) {
    throw new AppError(404, 'School not found');
  }

  const { grade, status } = rawQuery;
  const students = await findStudentsBySchoolForQr(schoolId, {
    grade: grade || undefined,
    qrStatus: status || undefined,
  });

  return students.map(toMealCardResponse);
};

const updateQRStatus = async (studentId, status) => {
  if (!['pending', 'printed'].includes(status)) {
    throw new AppError(400, 'Status must be pending or printed');
  }
  const student = await updateStudentById(studentId, { qrStatus: status });
  if (!student) {
    throw new AppError(404, 'Student not found');
  }

  if (!student.guardian?.smsOptOut && student.guardian?.phone) {
    const name = `${student.firstName} ${student.lastName}`;
    const statusLabel =
      status === 'printed' ? 'printed and ready' : 'pending review';
    await sendGuardianSms(
      student.guardian.phone,
      `KidsFeed: The meal card QR code for ${name} is now ${statusLabel}. Contact your school for more information.`
    );
  }

  return toStudentResponse(student);
};

export { generateStudentQR, batchGenerateQR, listQRCards, updateQRStatus };

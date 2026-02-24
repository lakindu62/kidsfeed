import express from 'express';
import { findSchoolById } from '../../infrastructure/repositories/school.repository.js';
import { findStudentsBySchoolForQr } from '../../infrastructure/repositories/student.repository.js';
import {
  generateDistrictReportPDF,
  generateQRCardsPDF,
  generateCSVExport,
} from '../../infrastructure/services/file-storage.service.js';
import { AppError } from '../../application/errors/app-error.js';

const router = express.Router({ mergeParams: true });

// GET /schools/:schoolId/export/district-report
router.get('/export/district-report', async (req, res, next) => {
  try {
    const school = await findSchoolById(req.params.schoolId);
    if (!school) return next(new AppError(404, 'School not found'));

    const students = await findStudentsBySchoolForQr(req.params.schoolId);
    const pdfBuffer = await generateDistrictReportPDF(school, students);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="district-report-${school.districtNumber}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// GET /schools/:schoolId/qr/export/csv
router.get('/qr/export/csv', async (req, res, next) => {
  try {
    const school = await findSchoolById(req.params.schoolId);
    if (!school) return next(new AppError(404, 'School not found'));

    const students = await findStudentsBySchoolForQr(req.params.schoolId);
    const records = students.map((s) => ({
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      gradeLevel: s.gradeLevel || '',
      qrStatus: s.qrStatus,
      qrGeneratedAt: s.qrGeneratedAt ? s.qrGeneratedAt.toISOString() : '',
    }));

    const csv = generateCSVExport(records, [
      'studentId',
      'firstName',
      'lastName',
      'gradeLevel',
      'qrStatus',
      'qrGeneratedAt',
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qr-cards-${req.params.schoolId}.csv"`
    );
    return res.send(csv);
  } catch (error) {
    next(error);
  }
});

// GET /schools/:schoolId/qr/export/pdf
router.get('/qr/export/pdf', async (req, res, next) => {
  try {
    const school = await findSchoolById(req.params.schoolId);
    if (!school) return next(new AppError(404, 'School not found'));

    const students = await findStudentsBySchoolForQr(req.params.schoolId);
    const pdfBuffer = await generateQRCardsPDF(students);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qr-cards-${req.params.schoolId}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export { router as exportRouter };

// Presentation layer adapter that turns a scanned QR payload into a call
// to the core attendance service. The QR token is decoded here and the
// resulting studentId is passed down as a MarkAttendanceDto.
import express from 'express';
import { MealAttendanceRepository } from '../../infrastructure/repositories/meal-attendance.repository.js';
import { MealSessionRepository } from '../../infrastructure/repositories/meal-session.repository.js';
import { MealAttendanceService } from '../../application/services/meal-attendance.service.js';
import { MarkAttendanceDto } from '../../application/dtos/requests/mark-attendance.dto.js';
import { ScanQrDto } from '../../application/dtos/requests/scan-qr.dto.js';
import { validateScanQr } from '../validators/scan-qr.validator.js';

const mealAttendanceRepository = new MealAttendanceRepository();
const mealSessionRepository = new MealSessionRepository();
const mealAttendanceService = new MealAttendanceService(
  mealAttendanceRepository,
  mealSessionRepository
);

export const mealScanRouter = express.Router();

// Scan QR and mark attendance: POST /api/meal-scan
mealScanRouter.post('/', validateScanQr, async (req, res, next) => {
  try {
    const dto = new ScanQrDto(req.body);

    let payload;
    try {
      payload = JSON.parse(dto.qrToken);
    } catch {
      return res
        .status(400)
        .json({ message: 'Invalid qrToken: must be a JSON string payload' });
    }

    const { studentId } = payload || {};
    if (!studentId) {
      return res
        .status(400)
        .json({ message: 'QR payload must contain studentId' });
    }

    const markDto = new MarkAttendanceDto({
      studentId,
      mealSessionId: dto.mealSessionId,
      status: 'PRESENT',
      servedAt: new Date(),
      notes: undefined,
    });

    const result = await mealAttendanceService.markAttendance(markDto);

    if (result.error === 'MEAL_SESSION_NOT_FOUND') {
      return res.status(404).json({ message: 'Meal session not found' });
    }
    if (result.error === 'MEAL_SESSION_COMPLETED') {
      return res.status(409).json({
        message: 'Meal session is completed; attendance is locked',
      });
    }
    if (result.error === 'STUDENT_NOT_IN_SCHOOL') {
      return res.status(400).json({
        message:
          'That student ID is not an active student at this school for this meal session.',
      });
    }
    if (result.error === 'STUDENT_ALREADY_PRESENT') {
      return res.status(409).json({
        message:
          'This student is already marked present for this meal session.',
      });
    }

    return res.status(201).json(result.attendance);
  } catch (err) {
    next(err);
  }
});

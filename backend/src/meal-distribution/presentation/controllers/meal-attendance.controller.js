import express from 'express';
import { MealAttendanceRepository } from '../../infrastructure/repositories/meal-attendance.repository.js';
import { MealSessionRepository } from '../../infrastructure/repositories/meal-session.repository.js';
import { MealAttendanceService } from '../../application/services/meal-attendance.service.js';
import { MarkAttendanceDto } from '../../application/dtos/requests/mark-attendance.dto.js';
import { validateMarkAttendance } from '../validators/mark-attendance.validator.js';

const mealAttendanceRepository = new MealAttendanceRepository();
const mealSessionRepository = new MealSessionRepository();
const mealAttendanceService = new MealAttendanceService(
  mealAttendanceRepository,
  mealSessionRepository
);

export const mealAttendanceRouter = express.Router();

// List: GET /api/meal-attendance?studentId=&mealSessionId=&status=&dateFrom=&dateTo=
mealAttendanceRouter.get('/', async (req, res, next) => {
  try {
    const items = await mealAttendanceService.listAttendance(req.query);
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

// Session roster: GET /api/meal-attendance/roster?mealSessionId=
mealAttendanceRouter.get('/roster', async (req, res, next) => {
  try {
    const { mealSessionId } = req.query || {};
    if (!mealSessionId) {
      return res.status(400).json({ message: 'mealSessionId is required' });
    }

    const result = await mealAttendanceService.listSessionRoster(mealSessionId);
    if (result.error === 'MEAL_SESSION_NOT_FOUND') {
      return res.status(404).json({ message: 'Meal session not found' });
    }
    return res.status(200).json(result.roster);
  } catch (err) {
    next(err);
  }
});

// Get one: GET /api/meal-attendance/:id
mealAttendanceRouter.get('/:id', async (req, res, next) => {
  try {
    const item = await mealAttendanceService.getAttendanceById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Meal attendance not found' });
    }
    return res.status(200).json(item);
  } catch (err) {
    next(err);
  }
});

// Create / mark attendance: POST /api/meal-attendance
mealAttendanceRouter.post(
  '/',
  validateMarkAttendance,
  async (req, res, next) => {
    try {
      const dto = new MarkAttendanceDto(req.body);
      const result = await mealAttendanceService.markAttendance(dto);

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
  }
);

// Update attendance: PUT /api/meal-attendance/:id
mealAttendanceRouter.put('/:id', async (req, res, next) => {
  try {
    const dto = new MarkAttendanceDto(req.body);
    const result = await mealAttendanceService.updateAttendance(
      req.params.id,
      dto
    );

    if (result.notFound) {
      return res.status(404).json({ message: 'Meal attendance not found' });
    }
    if (result.error === 'MEAL_SESSION_COMPLETED') {
      return res
        .status(409)
        .json({ message: 'Meal session is completed; attendance is locked' });
    }

    return res.status(200).json(result.attendance);
  } catch (err) {
    next(err);
  }
});

// Delete attendance: DELETE /api/meal-attendance/:id
mealAttendanceRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await mealAttendanceService.deleteAttendance(req.params.id);

    if (result.notFound) {
      return res.status(404).json({ message: 'Meal attendance not found' });
    }
    if (result.error === 'MEAL_SESSION_COMPLETED') {
      return res
        .status(409)
        .json({ message: 'Meal session is completed; attendance is locked' });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

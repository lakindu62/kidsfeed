import express from 'express';
import { MealSessionRepository } from '../../infrastructure/repositories/meal-session.repository.js';
import { MealAttendanceRepository } from '../../infrastructure/repositories/meal-attendance.repository.js';
import { MealGuardianNotificationRepository } from '../../infrastructure/repositories/meal-guardian-notification.repository.js';
import { MealSessionService } from '../../application/services/meal-session.service.js';
import { MealSessionCompletionService } from '../../application/services/meal-session-completion.service.js';
import { NotificationService } from '../../infrastructure/services/notification.service.js';
import { CreateMealSessionDto } from '../../application/dtos/requests/create-meal-session.dto.js';
import { UpdateMealSessionDto } from '../../application/dtos/requests/update-meal-session.dto.js';
import { validateCreateMealSession } from '../validators/create-meal-session.validator.js';
import { validateUpdateMealSession } from '../validators/update-meal-session.validator.js';

const mealSessionRepository = new MealSessionRepository();
const mealAttendanceRepository = new MealAttendanceRepository();
const mealGuardianNotificationRepository =
  new MealGuardianNotificationRepository();
const notificationService = new NotificationService();
const completionService = new MealSessionCompletionService({
  mealAttendanceRepository,
  mealGuardianNotificationRepository,
  notificationService,
});
const mealSessionService = new MealSessionService(mealSessionRepository, {
  completionService,
  mealGuardianNotificationRepository,
});

export const mealSessionRouter = express.Router();

// List: GET /api/meal-sessions?schoolId=&mealType=&date=&dateFrom=&dateTo=
mealSessionRouter.get('/', async (req, res, next) => {
  try {
    const sessions = await mealSessionService.listMealSessions(req.query);
    return res.status(200).json(sessions);
  } catch (err) {
    next(err);
  }
});

// Guardian email audit for a session (must be before GET /:id)
mealSessionRouter.get('/:id/guardian-notifications', async (req, res, next) => {
  try {
    const session = await mealSessionService.getMealSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Meal session not found' });
    }
    const items = await mealSessionService.listGuardianNotificationsForSession(
      req.params.id
    );
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

// Get one: GET /api/meal-sessions/:id
mealSessionRouter.get('/:id', async (req, res, next) => {
  try {
    const session = await mealSessionService.getMealSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Meal session not found' });
    }
    return res.status(200).json(session);
  } catch (err) {
    next(err);
  }
});

mealSessionRouter.post(
  '/',
  validateCreateMealSession,
  async (req, res, next) => {
    try {
      const dto = new CreateMealSessionDto(req.body);
      const session = await mealSessionService.createMealSession(dto);
      return res.status(201).json(session);
    } catch (err) {
      if (err?.code === 'MEAL_SESSION_DUPLICATE') {
        return res.status(409).json({ message: err.message });
      }
      next(err);
    }
  }
);

// Update: PUT /api/meal-sessions/:id
mealSessionRouter.put(
  '/:id',
  validateUpdateMealSession,
  async (req, res, next) => {
    try {
      const dto = new UpdateMealSessionDto(req.body);
      const session = await mealSessionService.updateMealSession(
        req.params.id,
        dto
      );
      if (!session) {
        return res.status(404).json({ message: 'Meal session not found' });
      }
      return res.status(200).json(session);
    } catch (err) {
      next(err);
    }
  }
);

// Delete: DELETE /api/meal-sessions/:id
mealSessionRouter.delete(
  '/:id',
  validateUpdateMealSession,
  async (req, res, next) => {
    try {
      const deleted = await mealSessionService.deleteMealSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Meal session not found' });
      }
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

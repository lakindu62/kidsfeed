import express from 'express';
import { MealSessionRepository } from '../../infrastructure/repositories/meal-session.repository.js';
import { MealSessionService } from '../../application/services/meal-session.service.js';
import { CreateMealSessionDto } from '../../application/dtos/requests/create-meal-session.dto.js';
import { UpdateMealSessionDto } from '../../application/dtos/requests/update-meal-session.dto.js';
import { validateCreateMealSession } from '../validators/create-meal-session.validator.js';
import { validateUpdateMealSession } from '../validators/update-meal-session.validator.js';

const mealSessionRepository = new MealSessionRepository();
const mealSessionService = new MealSessionService(mealSessionRepository);

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

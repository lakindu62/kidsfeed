import express from 'express';
import { listStudentMealHistory } from '../../application/services/student-meal-history-list.service.js';

export const studentMealHistoryRouter = express.Router();

studentMealHistoryRouter.get('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '').trim();
    const studentId = String(req.query.studentId || '').trim();
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId is required' });
    }
    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const rows = await listStudentMealHistory({
      schoolId,
      studentId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      mealType: req.query.mealType,
      attendanceStatus: req.query.attendanceStatus,
    });

    return res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

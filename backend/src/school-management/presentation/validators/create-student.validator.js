import { AppError } from '../../application/errors/app-error.js';

const validateCreateStudent = (req, res, next) => {
  const { studentId, firstName, lastName } = req.body || {};
  const errors = [];

  if (!studentId || studentId.trim() === '') {
    errors.push({ field: 'studentId', message: 'Student ID is required' });
  }
  if (!firstName || firstName.trim() === '') {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  if (!lastName || lastName.trim() === '') {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  if (errors.length > 0) return next(new AppError(400, 'Validation failed', errors));
  next();
};

export { validateCreateStudent };

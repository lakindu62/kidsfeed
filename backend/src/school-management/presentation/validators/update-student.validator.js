import { AppError } from '../../application/errors/app-error.js';

const validateUpdateStudent = (req, res, next) => {
  const { status } = req.body || {};
  const errors = [];

  if (status !== undefined && !['active', 'draft'].includes(status)) {
    errors.push({ field: 'status', message: 'Status must be active or draft' });
  }

  if (errors.length > 0) return next(new AppError(400, 'Validation failed', errors));
  next();
};

export { validateUpdateStudent };

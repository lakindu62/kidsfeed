import { AppError } from '../../application/errors/app-error.js';

const validateStudentIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!id || id.trim() === '') {
    return next(new AppError(400, 'Valid student id is required'));
  }
  next();
};

export { validateStudentIdParam };

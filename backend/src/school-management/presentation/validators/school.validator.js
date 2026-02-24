import { AppError } from '../../application/errors/app-error.js';

const validateCreateSchool = (req, res, next) => {
  const { schoolName, managerEmail, districtNumber } = req.body || {};
  const errors = [];

  if (!schoolName || schoolName.trim() === '') {
    errors.push({ field: 'schoolName', message: 'School name is required' });
  }
  if (!managerEmail || managerEmail.trim() === '') {
    errors.push({ field: 'managerEmail', message: 'Manager email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
    errors.push({ field: 'managerEmail', message: 'Invalid email format' });
  }
  if (!districtNumber || districtNumber.trim() === '') {
    errors.push({ field: 'districtNumber', message: 'District number is required' });
  }

  if (errors.length > 0) return next(new AppError(400, 'Validation failed', errors));
  next();
};

const validateUpdateSchool = (req, res, next) => {
  const { managerEmail } = req.body || {};
  const errors = [];

  if (managerEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
    errors.push({ field: 'managerEmail', message: 'Invalid email format' });
  }

  if (errors.length > 0) return next(new AppError(400, 'Validation failed', errors));
  next();
};

export { validateCreateSchool, validateUpdateSchool };

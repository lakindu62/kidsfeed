import MealPlanNotFoundException from '../../domain/exceptions/MealPlanNotFoundException.js';
import InvalidMealPlanException from '../../domain/exceptions/InvalidMealPlanException.js';

const errorHandler = (err, req, res, _next) => {
  console.error(err);

  if (err instanceof MealPlanNotFoundException) {
    return res.status(404).json({ success: false, error: err.message });
  }

  if (err instanceof InvalidMealPlanException) {
    return res.status(400).json({ success: false, error: err.message });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, error: 'Validation failed', details: errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
};

export default errorHandler;

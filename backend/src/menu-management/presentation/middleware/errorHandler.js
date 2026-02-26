import RecipeNotFoundException from '../../domain/exceptions/RecipeNotFoundException.js';
import InvalidRecipeException from '../../domain/exceptions/InvalidRecipeException.js';

// Centralized Express error handler; maps error types to HTTP status codes
const errorHandler = (err, req, res, _next) => {
  console.error('Error occured: ', err);

  if (err instanceof RecipeNotFoundException) {
    return res.status(404).json({ success: false, error: err.message });
  }

  if (err instanceof InvalidRecipeException) {
    return res.status(400).json({ success: false, error: err.message });
  }

  // Mongoose schema validation failure
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, error: 'Validation failed', details: errors });
  }

  // Invalid MongoDB ObjectId format
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  // MongoDB unique index violation
  if (err.code === 11000) {
    return res
      .status(409)
      .json({
        success: false,
        error: 'Duplicate entry',
        details: err.keyValue,
      });
  }

  if (err.message) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, error: err.message });
  }

  return res
    .status(500)
    .json({ success: false, error: 'Internal server error' });
};

export default errorHandler;

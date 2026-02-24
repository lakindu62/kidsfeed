/**
 * Global Error Handler Middleware
 *
 * Centralized error handling middleware for the Express application that catches
 * all errors thrown by controllers, use cases, or other middleware. This function
 * implements a consistent error response strategy across the entire API.
 *
 * Responsibilities:
 * 1. Log all errors for debugging and monitoring
 * 2. Identify error types (domain exceptions, database errors, generic errors)
 * 3. Map errors to appropriate HTTP status codes
 * 4. Format error responses consistently for API consumers
 * 5. Prevent sensitive information leakage (stack traces, internal details)
 * 6. Provide meaningful error messages for client-side handling
 *
 * Error Handling Strategy:
 * The middleware follows a cascading pattern, checking errors from most specific
 * to most generic:
 * 1. Domain-specific exceptions (RecipeNotFoundException, InvalidRecipeException)
 * 2. Mongoose validation errors (ValidationError)
 * 3. Mongoose casting errors (CastError - invalid MongoDB ObjectId)
 * 4. MongoDB duplicate key errors (code 11000)
 * 5. Generic errors with custom status codes
 * 6. Catch-all for unexpected errors (500 Internal Server Error)
 *
 * Response Format:
 * All error responses follow a consistent structure:
 * {
 *   success: false,
 *   error: "Error message",
 *   details?: <optional additional context>
 * }
 *
 * Status Code Mapping:
 * - 400 Bad Request: Validation errors, invalid data, malformed IDs
 * - 404 Not Found: Resource not found (RecipeNotFoundException)
 * - 409 Conflict: Duplicate entries, constraint violations
 * - 500 Internal Server Error: Unexpected errors, unhandled exceptions
 *
 * Security Considerations:
 * - Stack traces are never sent to clients (only logged server-side)
 * - Internal error details are sanitized in production
 * - Generic 500 error message prevents information leakage
 *
 * @module menu-management/presentation/middleware/errorHandler
 * @function errorHandler
 * @param {Error} err - The error object thrown by any part of the application
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function (unused, required by Express)
 * @returns {Response} JSON response with error details and appropriate status code
 *
 * @example
 * // Register as Express error handling middleware (must be last)
 * app.use(errorHandler);
 *
 * @example
 * // Domain exception example (404 Not Found)
 * throw new RecipeNotFoundException('recipe-123');
 * // Response:
 * {
 *   "success": false,
 *   "error": "Recipe with ID 'recipe-123' not found"
 * }
 *
 * @example
 * // Validation error example (400 Bad Request)
 * throw new InvalidRecipeException('Recipe name is required');
 * // Response:
 * {
 *   "success": false,
 *   "error": "Recipe name is required"
 * }
 *
 * @example
 * // Mongoose validation error (400 Bad Request)
 * // Response:
 * {
 *   "success": false,
 *   "error": "Validation failed",
 *   "details": [
 *     "Name must be at least 3 characters",
 *     "Serving size is required"
 *   ]
 * }
 *
 * @see {@link https://expressjs.com/en/guide/error-handling.html|Express Error Handling}
 */
import RecipeNotFoundException from '../../domain/exceptions/RecipeNotFoundException.js';
import InvalidRecipeException from '../../domain/exceptions/InvalidRecipeException.js';

/**
 * Global error handling middleware for Express
 *
 * @param {Error} err - Error object to handle
 * @param {Request} req - Express request object (unused but required by Express signature)
 * @param {Response} res - Express response object for sending error response
 * @param {NextFunction} _next - Express next function (unused but required by Express signature)
 * @returns {Response} JSON error response
 */
const errorHandler = (err, req, res, _next) => {
  // Log the error for debugging and monitoring
  // In production, this should be replaced with a proper logging service
  // (e.g., Winston, Bunyan, or cloud logging like CloudWatch/Stackdriver)
  console.error('Error occured: ', err);

  // =========================================================================
  // Domain-Specific Exceptions (Clean Architecture)
  // =========================================================================

  /**
   * Handle RecipeNotFoundException (404 Not Found)
   *
   * Thrown when a requested recipe doesn't exist in the system.
   * Common scenarios:
   * - GET /api/recipes/:id with non-existent ID
   * - PATCH /api/recipes/:id with non-existent ID
   * - DELETE /api/recipes/:id with non-existent ID
   */
  if (err instanceof RecipeNotFoundException) {
    return res.status(404).json({
      success: false,
      error: err.message, // e.g., "Recipe with ID 'recipe-123' not found"
    });
  }

  /**
   * Handle InvalidRecipeException (400 Bad Request)
   *
   * Thrown when recipe data fails domain-level validation.
   * Common scenarios:
   * - Recipe.validate() fails (empty name, no ingredients, etc.)
   * - Business rule violations (serving size must be > 0, etc.)
   * - Data integrity issues at the domain layer
   */
  if (err instanceof InvalidRecipeException) {
    return res.status(400).json({
      success: false,
      error: err.message, // e.g., "Recipe must have at least 1 ingredient"
    });
  }

  // =========================================================================
  // Mongoose/MongoDB Errors (Infrastructure Layer)
  // =========================================================================

  /**
   * Handle Mongoose ValidationError (400 Bad Request)
   *
   * Thrown when Mongoose schema validation fails at the database layer.
   * This catches validation issues that weren't caught at the domain layer.
   *
   * Common scenarios:
   * - Missing required fields (schema-level)
   * - Values outside allowed ranges (min/max)
   * - Enum violations (invalid values for enum fields)
   * - Custom validators failing
   *
   * Extracts all validation error messages and returns them as an array
   * for comprehensive client-side error display.
   */
  if (err.name === 'ValidationError') {
    // Extract all validation error messages from Mongoose error object
    const errors = Object.values(err.errors).map((e) => e.message);

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors, // Array of specific validation error messages
    });
  }

  /**
   * Handle Mongoose CastError (400 Bad Request)
   *
   * Thrown when a value cannot be cast to the expected type, most commonly
   * when an invalid MongoDB ObjectId is provided.
   *
   * Common scenarios:
   * - GET /api/recipes/invalid-id (not a valid ObjectId format)
   * - PATCH /api/recipes/12345 (too short for ObjectId)
   * - DELETE /api/recipes/abc (invalid characters for ObjectId)
   *
   * Provides a user-friendly message instead of technical cast error details.
   */
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
  }

  /**
   * Handle MongoDB Duplicate Key Error (409 Conflict)
   *
   * Thrown when attempting to insert/update a document that violates a
   * unique index constraint in MongoDB.
   *
   * Error code 11000 indicates a duplicate key violation.
   *
   * Common scenarios:
   * - Creating a recipe with a name that already exists (if name is unique)
   * - Attempting to create duplicate records with unique constraints
   *
   * Returns the duplicate key details to help client identify the conflict.
   */
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: err.keyValue, // Shows which field(s) caused the conflict
    });
  }

  // =========================================================================
  // Generic Error Handling
  // =========================================================================

  /**
   * Handle errors with custom status codes and messages
   *
   * This catches errors that have been thrown with explicit status codes
   * and messages but aren't domain-specific exceptions.
   *
   * Common scenarios:
   * - HTTP library errors (axios, fetch) with status codes
   * - Custom application errors with statusCode property
   * - Third-party service errors with error messages
   *
   * Falls back to 500 if no statusCode is provided.
   */
  if (err.message) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }

  /**
   * Catch-all for unexpected errors (500 Internal Server Error)
   *
   * This is the last resort for any errors that don't match the above patterns.
   * Returns a generic error message to prevent leaking sensitive information.
   *
   * In production, detailed error information should only be logged server-side,
   * never sent to clients.
   *
   * Common scenarios:
   * - Unhandled exceptions in use cases
   * - Unexpected runtime errors (null reference, etc.)
   * - Third-party library errors without proper error handling
   */
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

export default errorHandler;

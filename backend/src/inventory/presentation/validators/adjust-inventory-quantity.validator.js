/**
 * Validator middleware for increment/decrement inventory quantity requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function validateAdjustInventoryQuantity(req, res, next) {
  const body = req.body || {};

  if (body.amount === undefined || body.amount === null) {
    return res.status(400).json({
      success: false,
      message: 'amount is required',
    });
  }

  if (typeof body.amount !== 'number' || Number.isNaN(body.amount)) {
    return res.status(400).json({
      success: false,
      message: 'amount must be a valid number',
    });
  }

  if (body.amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'amount must be greater than 0',
    });
  }

  next();
}

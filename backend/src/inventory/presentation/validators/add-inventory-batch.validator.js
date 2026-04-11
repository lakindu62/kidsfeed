/**
 * Validator middleware for adding a stock batch to an inventory item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function validateAddInventoryBatch(req, res, next) {
  const body = req.body || {};

  if (body.quantity === undefined || body.quantity === null) {
    return res.status(400).json({
      success: false,
      message: 'quantity is required',
    });
  }

  if (typeof body.quantity !== 'number' || body.quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'quantity must be a non-negative number',
    });
  }

  if (
    body.expiryDate !== undefined &&
    body.expiryDate !== null &&
    isNaN(Date.parse(body.expiryDate))
  ) {
    return res.status(400).json({
      success: false,
      message: 'expiryDate must be a valid date if provided',
    });
  }

  if (body.supplier !== undefined && typeof body.supplier !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'supplier must be a string if provided',
    });
  }

  if (
    body.unitPrice !== undefined &&
    (typeof body.unitPrice !== 'number' || body.unitPrice < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: 'unitPrice must be a non-negative number if provided',
    });
  }

  if (body.location !== undefined && typeof body.location !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'location must be a string if provided',
    });
  }

  if (body.batchNote !== undefined && typeof body.batchNote !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'batchNote must be a string if provided',
    });
  }

  if (body.status !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'status is derived by the server and cannot be set manually',
    });
  }

  if (body.expiryStatus !== undefined) {
    return res.status(400).json({
      success: false,
      message:
        'expiryStatus is derived by the server and cannot be set manually',
    });
  }

  next();
}

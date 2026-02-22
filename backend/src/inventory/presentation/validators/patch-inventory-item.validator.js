import { INVENTORY_CATEGORIES } from '../../application/constants/inventory-constants.js';

/**
 * Validator middleware for patching an inventory item (PATCH - partial update)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function validatePatchInventoryItem(req, res, next) {
  const body = req.body || {};

  // For PATCH, no fields are required, but validate those that are present
  if (
    body.name !== undefined &&
    (typeof body.name !== 'string' || body.name.trim() === '')
  ) {
    return res.status(400).json({
      success: false,
      message: 'name must be a non-empty string if provided',
    });
  }

  if (
    body.category !== undefined &&
    !Object.values(INVENTORY_CATEGORIES).includes(body.category)
  ) {
    return res.status(400).json({
      success: false,
      message: `category must be one of: ${Object.values(INVENTORY_CATEGORIES).join(', ')}`,
    });
  }

  if (
    body.quantity !== undefined &&
    (typeof body.quantity !== 'number' || body.quantity < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: 'quantity must be a non-negative number if provided',
    });
  }

  if (
    body.unit !== undefined &&
    (typeof body.unit !== 'string' || body.unit.trim() === '')
  ) {
    return res.status(400).json({
      success: false,
      message: 'unit must be a non-empty string if provided',
    });
  }

  if (
    body.reorderLevel !== undefined &&
    (typeof body.reorderLevel !== 'number' || body.reorderLevel < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: 'reorderLevel must be a non-negative number if provided',
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

  // Check that at least one field is being updated
  if (Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one field must be provided for update',
    });
  }

  next();
}

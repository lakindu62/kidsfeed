import { INVENTORY_CATEGORIES } from '../../application/constants/inventory-constants.js';

/**
 * Validator middleware for updating an inventory item (PUT - full update)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function validateUpdateInventoryItem(req, res, next) {
  const { name, category, quantity, unit } = req.body || {};

  // Check required fields for PUT (full update)
  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'name is required and cannot be empty',
    });
  }

  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'category is required',
    });
  }

  // Validate category value
  if (!Object.values(INVENTORY_CATEGORIES).includes(category)) {
    return res.status(400).json({
      success: false,
      message: `category must be one of: ${Object.values(INVENTORY_CATEGORIES).join(', ')}`,
    });
  }

  if (quantity === undefined || quantity === null) {
    return res.status(400).json({
      success: false,
      message: 'quantity is required',
    });
  }

  // Validate quantity is a non-negative number
  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'quantity must be a non-negative number',
    });
  }

  if (!unit || unit.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'unit is required',
    });
  }

  // Validate optional numeric fields
  if (
    req.body.reorderLevel !== undefined &&
    (typeof req.body.reorderLevel !== 'number' || req.body.reorderLevel < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: 'reorderLevel must be a non-negative number',
    });
  }

  if (
    req.body.unitPrice !== undefined &&
    (typeof req.body.unitPrice !== 'number' || req.body.unitPrice < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: 'unitPrice must be a non-negative number',
    });
  }

  // Validate expiry date if provided
  if (req.body.expiryDate && isNaN(Date.parse(req.body.expiryDate))) {
    return res.status(400).json({
      success: false,
      message: 'expiryDate must be a valid date',
    });
  }

  next();
}

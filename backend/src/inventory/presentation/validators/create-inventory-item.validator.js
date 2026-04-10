import { INVENTORY_CATEGORIES } from '../../application/constants/inventory-constants.js';

const NUTRITIONAL_GRADES = ['a', 'b', 'c', 'd', 'e'];

function isStringArray(value) {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isValidOptionalUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  if (value.trim() === '') {
    return true;
  }

  try {
    // URL constructor is used only for validation; no outbound calls are made.
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validator middleware for creating an inventory item safely
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function validateCreateInventoryItem(req, res, next) {
  const { name, category, quantity, unit } = req.body || {};

  if (req.body?.status !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'status is derived by the server and cannot be set manually',
    });
  }

  // Check required fields
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

  if (
    req.body.packageWeight !== undefined &&
    (typeof req.body.packageWeight !== 'number' || req.body.packageWeight < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: 'packageWeight must be a non-negative number',
    });
  }

  if (
    req.body.barcode !== undefined &&
    (typeof req.body.barcode !== 'string' ||
      (req.body.barcode.trim() !== '' &&
        !/^\d+$/.test(req.body.barcode.trim())))
  ) {
    return res.status(400).json({
      success: false,
      message: 'barcode must be a string of digits when provided',
    });
  }

  if (req.body.brand !== undefined && typeof req.body.brand !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'brand must be a string when provided',
    });
  }

  if (req.body.allergens !== undefined && !isStringArray(req.body.allergens)) {
    return res.status(400).json({
      success: false,
      message: 'allergens must be an array of strings when provided',
    });
  }

  if (req.body.traces !== undefined && !isStringArray(req.body.traces)) {
    return res.status(400).json({
      success: false,
      message: 'traces must be an array of strings when provided',
    });
  }

  if (
    req.body.ingredients !== undefined &&
    typeof req.body.ingredients !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'ingredients must be a string when provided',
    });
  }

  if (
    req.body.imageUrl !== undefined &&
    !isValidOptionalUrl(req.body.imageUrl)
  ) {
    return res.status(400).json({
      success: false,
      message: 'imageUrl must be a valid URL when provided',
    });
  }

  if (
    req.body.packageWeightUnit !== undefined &&
    typeof req.body.packageWeightUnit !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'packageWeightUnit must be a string when provided',
    });
  }

  if (
    req.body.packageType !== undefined &&
    typeof req.body.packageType !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'packageType must be a string when provided',
    });
  }

  if (req.body.nutritionalGrade !== undefined) {
    if (typeof req.body.nutritionalGrade !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'nutritionalGrade must be a string when provided',
      });
    }

    const normalizedNutritionalGrade = req.body.nutritionalGrade
      .trim()
      .toLowerCase();

    if (
      normalizedNutritionalGrade !== '' &&
      !NUTRITIONAL_GRADES.includes(normalizedNutritionalGrade)
    ) {
      return res.status(400).json({
        success: false,
        message: 'nutritionalGrade must be one of: a, b, c, d, e',
      });
    }

    req.body.nutritionalGrade = normalizedNutritionalGrade;
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

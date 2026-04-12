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
 * Validator middleware for patching an inventory item safely (PATCH - partial update)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function validatePatchInventoryItem(req, res, next) {
  const body = req.body || {};

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

  if (body.expiryDate !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'expiryDate cannot be set on item-level patch requests',
    });
  }

  if (body.supplier !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'supplier cannot be set on item-level patch requests',
    });
  }

  if (body.unitPrice !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'unitPrice cannot be set on item-level patch requests',
    });
  }

  if (body.location !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'location cannot be set on item-level patch requests',
    });
  }

  if (body.batchNote !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'batchNote cannot be set on item-level patch requests',
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
    body.packageWeight !== undefined &&
    (typeof body.packageWeight !== 'number' || body.packageWeight < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: 'packageWeight must be a non-negative number if provided',
    });
  }

  if (
    body.barcode !== undefined &&
    (typeof body.barcode !== 'string' ||
      (body.barcode.trim() !== '' && !/^\d+$/.test(body.barcode.trim())))
  ) {
    return res.status(400).json({
      success: false,
      message: 'barcode must be a string of digits if provided',
    });
  }

  if (body.brand !== undefined && typeof body.brand !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'brand must be a string if provided',
    });
  }

  if (body.allergens !== undefined && !isStringArray(body.allergens)) {
    return res.status(400).json({
      success: false,
      message: 'allergens must be an array of strings if provided',
    });
  }

  if (body.traces !== undefined && !isStringArray(body.traces)) {
    return res.status(400).json({
      success: false,
      message: 'traces must be an array of strings if provided',
    });
  }

  if (body.ingredients !== undefined && typeof body.ingredients !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'ingredients must be a string if provided',
    });
  }

  if (body.imageUrl !== undefined && !isValidOptionalUrl(body.imageUrl)) {
    return res.status(400).json({
      success: false,
      message: 'imageUrl must be a valid URL if provided',
    });
  }

  if (
    body.packageWeightUnit !== undefined &&
    typeof body.packageWeightUnit !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'packageWeightUnit must be a string if provided',
    });
  }

  if (body.packageType !== undefined && typeof body.packageType !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'packageType must be a string if provided',
    });
  }

  if (body.nutritionalGrade !== undefined) {
    if (typeof body.nutritionalGrade !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'nutritionalGrade must be a string if provided',
      });
    }

    const normalizedNutritionalGrade = body.nutritionalGrade
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

    body.nutritionalGrade = normalizedNutritionalGrade;
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

import { AppError } from '../../application/errors/app-error.js';
import { DIETARY_TAGS } from '../../application/constants/dietary-restriction.js';

const validateDietaryUpdate = (req, res, next) => {
  const { dietaryTags } = req.body || {};
  const errors = [];

  if (dietaryTags !== undefined) {
    if (!Array.isArray(dietaryTags)) {
      errors.push({ field: 'dietaryTags', message: 'Dietary tags must be an array' });
    } else {
      const invalid = dietaryTags.filter((tag) => !DIETARY_TAGS.includes(tag));
      if (invalid.length > 0) {
        errors.push({
          field: 'dietaryTags',
          message: `Invalid dietary tags: ${invalid.join(', ')}. Valid values: ${DIETARY_TAGS.join(', ')}`,
        });
      }
    }
  }

  if (errors.length > 0) return next(new AppError(400, 'Validation failed', errors));
  next();
};

export { validateDietaryUpdate };

import express from 'express';
import { updateDietaryProfile } from '../../application/services/dietary.service.js';
import { validateDietaryUpdate } from '../validators/dietary.validator.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router();

// PUT /students/:id/dietary
router.put('/:id/dietary', validateDietaryUpdate, async (req, res, next) => {
  try {
    const student = await updateDietaryProfile(req.params.id, req.body);
    return sendSuccess(res, 200, 'Dietary profile updated successfully', student);
  } catch (error) {
    next(error);
  }
});

export { router as studentDietaryRouter };

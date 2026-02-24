import express from 'express';
import { updateSchool } from '../../application/services/school.service.js';
import { validateUpdateSchool } from '../validators/school.validator.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router();

router.put('/:id', validateUpdateSchool, async (req, res, next) => {
  try {
    const school = await updateSchool(req.params.id, req.body);
    return sendSuccess(res, 200, 'School updated successfully', school);
  } catch (error) {
    next(error);
  }
});

export { router as schoolPutRouter };

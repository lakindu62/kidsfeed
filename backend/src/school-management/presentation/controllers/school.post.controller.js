import express from 'express';
import { createNewSchool } from '../../application/services/school.service.js';
import { validateCreateSchool } from '../validators/school.validator.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router();

router.post('/', validateCreateSchool, async (req, res, next) => {
  try {
    const school = await createNewSchool(req.body);
    return sendSuccess(res, 201, 'School created successfully', school);
  } catch (error) {
    next(error);
  }
});

export { router as schoolPostRouter };

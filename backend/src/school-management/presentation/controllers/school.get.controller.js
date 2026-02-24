import express from 'express';
import { getAllSchools, getSchoolById } from '../../application/services/school.service.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const schools = await getAllSchools();
    return sendSuccess(res, 200, 'Schools retrieved successfully', schools);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const school = await getSchoolById(req.params.id);
    return sendSuccess(res, 200, 'School retrieved successfully', school);
  } catch (error) {
    next(error);
  }
});

export { router as schoolGetRouter };

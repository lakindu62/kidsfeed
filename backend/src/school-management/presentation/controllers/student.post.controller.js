import express from 'express';
import { createStudentForSchool } from '../../application/services/student.service.js';
import { validateCreateStudent } from '../validators/create-student.validator.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router({ mergeParams: true });

// POST /schools/:schoolId/students
router.post('/', validateCreateStudent, async (req, res, next) => {
  try {
    const student = await createStudentForSchool(req.params.schoolId, req.body);
    return sendSuccess(res, 201, 'Student created successfully', student);
  } catch (error) {
    next(error);
  }
});

export { router as studentPostRouter };

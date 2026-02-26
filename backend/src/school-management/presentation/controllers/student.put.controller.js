import express from 'express';
import { updateStudent } from '../../application/services/student.service.js';
import { validateUpdateStudent } from '../validators/update-student.validator.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router();

// PUT /students/:id
router.put('/:id', validateUpdateStudent, async (req, res, next) => {
  try {
    const student = await updateStudent(req.params.id, req.body);
    return sendSuccess(res, 200, 'Student updated successfully', student);
  } catch (error) {
    next(error);
  }
});

export { router as studentPutRouter };

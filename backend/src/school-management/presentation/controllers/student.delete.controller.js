import express from 'express';
import { deleteStudent } from '../../application/services/student.service.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router();

// DELETE /students/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteStudent(req.params.id);
    return sendSuccess(res, 200, 'Student deleted successfully', null);
  } catch (error) {
    next(error);
  }
});

export { router as studentDeleteRouter };

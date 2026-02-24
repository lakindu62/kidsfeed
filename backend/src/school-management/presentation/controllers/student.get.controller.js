import express from 'express';
import { getStudent, listStudentsForSchool } from '../../application/services/student.service.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router({ mergeParams: true });

// GET /schools/:schoolId/students
router.get('/', async (req, res, next) => {
  try {
    const result = await listStudentsForSchool(req.params.schoolId, req.query);
    return sendSuccess(res, 200, 'Students retrieved successfully', result);
  } catch (error) {
    next(error);
  }
});

// GET /students/:id
router.get('/:id', async (req, res, next) => {
  try {
    const student = await getStudent(req.params.id);
    return sendSuccess(res, 200, 'Student retrieved successfully', student);
  } catch (error) {
    next(error);
  }
});

export { router as studentGetRouter };
export default router;

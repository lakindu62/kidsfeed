import express from 'express';
import { getStudentProfile } from '../../application/services/student.service.js';
import { validateStudentIdParam } from '../validators/student-query.validator.js';

const router = express.Router();

router.get('/:studentId', validateStudentIdParam, async (req, res) => {
  try {
    const student = await getStudentProfile(req.params.studentId);
    return res.status(200).json(student);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message });
  }
});

export { router as studentGetRouter };
export default router;

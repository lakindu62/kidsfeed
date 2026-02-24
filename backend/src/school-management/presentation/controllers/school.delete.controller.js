import express from 'express';
import { deleteSchool } from '../../application/services/school.service.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router();

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteSchool(req.params.id);
    return sendSuccess(res, 200, 'School deleted successfully', null);
  } catch (error) {
    next(error);
  }
});

export { router as schoolDeleteRouter };

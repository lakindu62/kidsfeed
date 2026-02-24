import express from 'express';
import { globalSearch } from '../../application/services/search.service.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const router = express.Router();

// GET /search?q=...
router.get('/', async (req, res, next) => {
  try {
    const results = await globalSearch(req.query.q);
    return sendSuccess(res, 200, 'Search completed', results);
  } catch (error) {
    next(error);
  }
});

export { router as searchRouter };

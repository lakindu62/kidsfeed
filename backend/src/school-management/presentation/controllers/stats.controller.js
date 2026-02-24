import express from 'express';
import { getDashboardOverview, getSchoolStats } from '../../application/services/stats.service.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

const dashboardRouter = express.Router();
const schoolStatsRouter = express.Router({ mergeParams: true });

// GET /dashboard/overview
dashboardRouter.get('/overview', async (req, res, next) => {
  try {
    const data = await getDashboardOverview();
    return sendSuccess(res, 200, 'Dashboard overview retrieved successfully', data);
  } catch (error) {
    next(error);
  }
});

// GET /schools/:schoolId/stats
schoolStatsRouter.get('/', async (req, res, next) => {
  try {
    const data = await getSchoolStats(req.params.schoolId);
    return sendSuccess(res, 200, 'School stats retrieved successfully', data);
  } catch (error) {
    next(error);
  }
});

export { dashboardRouter, schoolStatsRouter };

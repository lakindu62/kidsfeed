import express from 'express';
import { listNoShowAlertsForSchool } from '../../application/services/no-show-alerts-list.service.js';

export const noShowAlertsRouter = express.Router();

noShowAlertsRouter.get('/', async (req, res, next) => {
  try {
    const schoolId = req.query.schoolId;
    if (!schoolId || !String(schoolId).trim()) {
      return res.status(400).json({ message: 'schoolId is required' });
    }

    const items = await listNoShowAlertsForSchool({
      schoolId: String(schoolId).trim(),
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

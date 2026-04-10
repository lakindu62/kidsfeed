import express from 'express';
import mongoose from 'mongoose';
import { findSchoolById } from '../../../school-management/infrastructure/repositories/school.repository.js';
import { MealAttendanceRepository } from '../../infrastructure/repositories/meal-attendance.repository.js';
import { MealSessionRepository } from '../../infrastructure/repositories/meal-session.repository.js';
import { MealAttendanceService } from '../../application/services/meal-attendance.service.js';
import {
  listNoShowReportRows,
  listSessionSummariesForSchool,
} from '../../application/services/meal-reports-data.service.js';
import {
  generateMealSessionSummaryPdf,
  generateNoShowReportPdf,
  generateSessionRosterPdf,
} from '../../infrastructure/services/meal-reports-pdf.service.js';

const mealAttendanceRepository = new MealAttendanceRepository();
const mealSessionRepository = new MealSessionRepository();
const mealAttendanceService = new MealAttendanceService(
  mealAttendanceRepository,
  mealSessionRepository
);

export const mealReportsRouter = express.Router();

function safeFilenamePart(value) {
  return (
    String(value || 'report')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'report'
  );
}

mealReportsRouter.get('/session-summary.pdf', async (req, res, next) => {
  try {
    const schoolId = req.query.schoolId;
    if (!schoolId || !String(schoolId).trim()) {
      return res.status(400).json({ message: 'schoolId is required' });
    }
    const sid = String(schoolId).trim();
    const school = await findSchoolById(sid);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const rows = await listSessionSummariesForSchool({
      schoolId: sid,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    const pdfBuffer = await generateMealSessionSummaryPdf({
      schoolName: school.schoolName,
      rows,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    const name = safeFilenamePart(school.schoolName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="meal-session-summary-${name}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

mealReportsRouter.get('/no-shows.pdf', async (req, res, next) => {
  try {
    const schoolId = req.query.schoolId;
    if (!schoolId || !String(schoolId).trim()) {
      return res.status(400).json({ message: 'schoolId is required' });
    }
    const sid = String(schoolId).trim();
    const school = await findSchoolById(sid);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const rows = await listNoShowReportRows({
      schoolId: sid,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    const pdfBuffer = await generateNoShowReportPdf({
      schoolName: school.schoolName,
      rows,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    const name = safeFilenamePart(school.schoolName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="meal-no-shows-${name}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

mealReportsRouter.get('/session-roster.pdf', async (req, res, next) => {
  try {
    const schoolId = req.query.schoolId;
    const mealSessionId = req.query.mealSessionId;
    if (!schoolId || !String(schoolId).trim()) {
      return res.status(400).json({ message: 'schoolId is required' });
    }
    if (!mealSessionId || !String(mealSessionId).trim()) {
      return res.status(400).json({ message: 'mealSessionId is required' });
    }
    const sid = String(schoolId).trim();
    const sessionId = String(mealSessionId).trim();
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid mealSessionId' });
    }

    const school = await findSchoolById(sid);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const session = await mealSessionRepository.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Meal session not found' });
    }
    if (String(session.schoolId) !== sid) {
      return res
        .status(403)
        .json({ message: 'Session does not belong to this school' });
    }

    const rosterResult =
      await mealAttendanceService.listSessionRoster(sessionId);
    if (rosterResult.error) {
      return res.status(404).json({ message: 'Meal session not found' });
    }

    const pdfBuffer = await generateSessionRosterPdf({
      schoolName: school.schoolName,
      sessionLabel: sessionId,
      mealType: session.mealType,
      sessionDate: session.date,
      sessionStatus: session.status,
      roster: rosterResult.roster,
    });

    const name = safeFilenamePart(school.schoolName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="meal-session-roster-${name}-${sessionId}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

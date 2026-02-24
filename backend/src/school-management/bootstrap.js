import express from 'express';

// School controllers
import { schoolGetRouter } from './presentation/controllers/school.get.controller.js';
import { schoolPostRouter } from './presentation/controllers/school.post.controller.js';
import { schoolPutRouter } from './presentation/controllers/school.put.controller.js';
import { schoolDeleteRouter } from './presentation/controllers/school.delete.controller.js';

// Student controllers
import { studentGetRouter } from './presentation/controllers/student.get.controller.js';
import { studentPostRouter } from './presentation/controllers/student.post.controller.js';
import { studentPutRouter } from './presentation/controllers/student.put.controller.js';
import { studentDeleteRouter } from './presentation/controllers/student.delete.controller.js';
import { studentDietaryRouter } from './presentation/controllers/student-dietary.controller.js';
import { studentImportRouter } from './presentation/controllers/student-import.controller.js';

// QR controllers
import { studentQrRouter, schoolQrRouter } from './presentation/controllers/qr-code.controller.js';

// Stats & search
import { dashboardRouter, schoolStatsRouter } from './presentation/controllers/stats.controller.js';
import { searchRouter } from './presentation/controllers/search.controller.js';

// Export (all routes relative to /schools/:schoolId)
import { exportRouter } from './presentation/controllers/export.controller.js';

// Error handler
import { errorHandler } from './presentation/middleware/error-handler.middleware.js';

const createSchoolManagementRouter = () => {
  const router = express.Router();

  // ── Schools ──────────────────────────────────────────────────────────────
  router.use('/schools', schoolGetRouter);
  router.use('/schools', schoolPostRouter);
  router.use('/schools', schoolPutRouter);
  router.use('/schools', schoolDeleteRouter);

  // ── Students nested under school (list + create) ──────────────────────
  router.use('/schools/:schoolId/students', studentPostRouter);
  router.use('/schools/:schoolId/students', studentGetRouter);

  // ── CSV Import ────────────────────────────────────────────────────────
  router.use('/schools/:schoolId/import', studentImportRouter);

  // ── School-level QR (batch + cards) ──────────────────────────────────
  router.use('/schools/:schoolId/qr', schoolQrRouter);

  // ── School stats ─────────────────────────────────────────────────────
  router.use('/schools/:schoolId/stats', schoolStatsRouter);

  // ── Export (district-report, qr/export/csv, qr/export/pdf) ──────────
  router.use('/schools/:schoolId', exportRouter);

  // ── Students standalone ───────────────────────────────────────────────
  router.use('/students', studentPutRouter);
  router.use('/students', studentDeleteRouter);
  router.use('/students', studentDietaryRouter);
  router.use('/students', studentQrRouter);
  router.use('/students', studentGetRouter);

  // ── Dashboard ─────────────────────────────────────────────────────────
  router.use('/dashboard', dashboardRouter);

  // ── Global search ─────────────────────────────────────────────────────
  router.use('/search', searchRouter);

  // ── Global error handler (must be last) ──────────────────────────────
  router.use(errorHandler);

  return router;
};

export { createSchoolManagementRouter };

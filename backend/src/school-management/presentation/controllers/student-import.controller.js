import express from 'express';
import { previewImport, confirmImport } from '../../application/services/student-import.service.js';
import { generateCSVTemplate } from '../../infrastructure/services/csv-parser.service.js';
import { csvUpload } from '../middleware/csv-upload.middleware.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';
import { AppError } from '../../application/errors/app-error.js';

const router = express.Router({ mergeParams: true });

// GET /schools/:schoolId/import/template
router.get('/template', (req, res) => {
  const csv = generateCSVTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student-import-template.csv"');
  return res.send(csv);
});

// POST /schools/:schoolId/import/preview
router.post('/preview', csvUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError(400, 'CSV file is required'));
    const result = await previewImport(req.params.schoolId, req.file.buffer);
    return sendSuccess(res, 200, 'Import preview generated', result);
  } catch (error) {
    next(error);
  }
});

// POST /schools/:schoolId/import/confirm
router.post('/confirm', async (req, res, next) => {
  try {
    const { importToken } = req.body || {};
    if (!importToken) return next(new AppError(400, 'Import token is required'));
    const result = await confirmImport(req.params.schoolId, importToken);
    return sendSuccess(res, 201, `Successfully imported ${result.imported} students`, result);
  } catch (error) {
    next(error);
  }
});

export { router as studentImportRouter };

import express from 'express';
import {
  generateStudentQR,
  batchGenerateQR,
  listQRCards,
  updateQRStatus,
} from '../../application/services/qr-code.service.js';
import { sendSuccess } from '../../application/helpers/response.helper.js';

// Router for /students/:id/qr and /students/:id/qr/status
const studentQrRouter = express.Router();

// GET /students/:id/qr
studentQrRouter.get('/:id/qr', async (req, res, next) => {
  try {
    const student = await generateStudentQR(req.params.id);
    return sendSuccess(res, 200, 'QR code generated successfully', student);
  } catch (error) {
    next(error);
  }
});

// PUT /students/:id/qr/status
studentQrRouter.put('/:id/qr/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const student = await updateQRStatus(req.params.id, status);
    return sendSuccess(res, 200, 'QR status updated successfully', student);
  } catch (error) {
    next(error);
  }
});

// Router for /schools/:schoolId/qr/*
const schoolQrRouter = express.Router({ mergeParams: true });

// POST /schools/:schoolId/qr/batch
schoolQrRouter.post('/batch', async (req, res, next) => {
  try {
    const { grade } = req.query;
    const result = await batchGenerateQR(req.params.schoolId, { grade });
    return sendSuccess(res, 200, 'Batch QR generation complete', result);
  } catch (error) {
    next(error);
  }
});

// GET /schools/:schoolId/qr/cards
schoolQrRouter.get('/cards', async (req, res, next) => {
  try {
    const cards = await listQRCards(req.params.schoolId, req.query);
    return sendSuccess(res, 200, 'QR cards retrieved successfully', cards);
  } catch (error) {
    next(error);
  }
});

export { studentQrRouter, schoolQrRouter };

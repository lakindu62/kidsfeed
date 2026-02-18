export function validateScanQr(req, res, next) {
  const { mealSessionId, qrToken } = req.body || {};

  if (!mealSessionId || !qrToken) {
    return res.status(400).json({
      message: 'mealSessionId and qrToken are required',
    });
  }

  next();
}

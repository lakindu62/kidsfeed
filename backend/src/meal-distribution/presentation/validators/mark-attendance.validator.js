export function validateMarkAttendance(req, res, next) {
  const { studentId, mealSessionId } = req.body || {};

  if (!studentId || !mealSessionId) {
    return res.status(400).json({
      message: 'studentId and mealSessionId are required',
    });
  }

  next();
}

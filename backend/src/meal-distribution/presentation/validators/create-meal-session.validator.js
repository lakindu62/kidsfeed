export function validateCreateMealSession(req, res, next) {
  const { date, mealType, schoolId } = req.body || {};

  if (!date || !mealType || !schoolId) {
    return res.status(400).json({
      message: "date, mealType and schoolId are required",
    });
  }

  next();
}


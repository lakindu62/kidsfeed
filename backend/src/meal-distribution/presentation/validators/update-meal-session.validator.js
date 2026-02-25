export function validateUpdateMealSession(req, res, next) {
  const id = req.params.id;
  if (!id || (typeof id === 'string' && id.trim() === '')) {
    return res.status(400).json({ message: 'Meal session id is required' });
  }
  next();
}

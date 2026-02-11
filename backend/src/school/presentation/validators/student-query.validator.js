const validateStudentIdParam = (req, res, next) => {
  const { studentId } = req.params;

  if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
    return res.status(400).json({ error: 'Valid studentId is required' });
  }

  next();
};

export { validateStudentIdParam };

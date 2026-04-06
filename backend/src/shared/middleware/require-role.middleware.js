/**
 * Factory function that returns an Express middleware to restrict access based on user role.
 * Must be used AFTER `apiRequireAuth` and `attachUser` in the middleware chain.
 *
 * @param {string[]} allowedRoles - Array of roles allowed to access the route (use ROLES constant).
 * @returns {import('express').RequestHandler}
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    // 1. Ensure user is attached
    if (!req.user) {
      return res.status(403).json({
        message:
          'User not attached to request — ensure attachUser runs before requireRole',
      });
    }

    // 2. Check if user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden: insufficient role',
      });
    }

    // Role check passed
    next();
  };
};

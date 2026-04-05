import { getAuth } from '@clerk/express';

/**
 * Verifies that the request carries a valid Clerk session.
 * Must be applied before attachUser on every protected route.
 *
 * @type {import('express').RequestHandler}
 */
export const apiRequireAuth = (req, res, next) => {
  const { isAuthenticated } = getAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

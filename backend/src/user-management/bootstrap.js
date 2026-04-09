import express from 'express';
import { userManagementRouter } from './presentation/controllers/user-role.controller.js';

const createUserManagementRouter = () => {
  const router = express.Router();

  // User role management routes
  router.use('/users', userManagementRouter);

  return router;
};

export { createUserManagementRouter };

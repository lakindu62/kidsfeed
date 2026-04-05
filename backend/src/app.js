import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';

dotenv.config();

// import { studentGetRouter } from './school/index.js';

// Meal distribution imports
import {
  mealSessionRouter,
  mealAttendanceRouter,
  mealScanRouter,
} from './meal-distribution/index.js';

// Menu Management Imports
import {
  recipeRouter,
  errorHandler as menuManagementErrorHandler,
} from './menu-management/index.js';

// Inventory imports
import { inventoryRouter } from './inventory/index.js';
import { createSchoolManagementRouter } from './school-management/bootstrap.js';

import { apiRequireAuth } from './shared/middleware/require-auth.middleware.js'; // ADD
import { attachUser } from './shared/middleware/attach-user.middleware.js';
import { requireRole } from './shared/middleware/require-role.middleware.js';
import { ROLES } from './shared/constants/roles.js';

const app = express();

//Auth Middleware from clerk
app.use(clerkMiddleware());

app.use(express.json());

// ── EXAMPLE PROTECTED ROUTE FOR DEVS ─────────────────────────────
// Other devs: To protect your routes, insert apiRequireAuth and
// attachUser BEFORE your router in the app.use chain. To enforce
// roles, add requireRole([ROLES.YOUR_ROLE]) after attachUser.
//
// app.use(
//   '/api/my-feature',
//   apiRequireAuth,
//   attachUser,
//   requireRole([ROLES.ADMIN, ROLES.MEAL_PLANNER]),
//   myFeatureRouter
// );
// ─────────────────────────────────────────────────────────────────

// School component routes
// app.use('/api/students', studentGetRouter);
const schoolRouter = createSchoolManagementRouter();
app.use('/api', schoolRouter);

// Meal distribution component routes
app.use('/api/meal-sessions', mealSessionRouter);
app.use('/api/meal-attendance', mealAttendanceRouter);
app.use('/api/meal-scan', mealScanRouter);

// Menu Management routes
app.use('/api/recipes', recipeRouter);

// Inventory component routes
app.use('/api/inventory', inventoryRouter);

// Menu Management Error Handler
app.use(menuManagementErrorHandler);

const MONGODB_URI = process.env.MONGODB_URI;

const PORT = process.env.PORT || 3000;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('DB connection failed:', err));

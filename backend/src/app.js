import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';

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
  nutritionRouter,
  errorHandler as menuManagementErrorHandler,
} from './menu-management/index.js';

// Inventory imports
import { inventoryRouter } from './inventory/index.js';
import { createSchoolManagementRouter } from './school-management/bootstrap.js';
import { clerkWebhookRouter } from './user-management/presentation/webhooks/clerk.webhook.router.js';

import { apiRequireAuth } from './shared/middleware/require-auth.middleware.js';
import { attachUser } from './shared/middleware/attach-user.middleware.js';
import { requireRole } from './shared/middleware/require-role.middleware.js';
import { ROLES } from './shared/constants/roles.js';

const app = express();

// Temporarily allow all origins for initial deployment testing.
// TODO: Lock this down to the specific Vercel frontend domain before production.
app.use(cors());

// Auth Middleware from clerk
app.use(clerkMiddleware());

// Clerk webhooks MUST be mounted before express.json() so Svix can read the raw request body
app.use('/api/webhooks', clerkWebhookRouter);

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
app.use('/api/nutrition', nutritionRouter);

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

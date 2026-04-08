import express from 'express';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import { corsOptions, handleCorsPreflight } from './config/cors.config.js';

dotenv.config();

import { connectDB } from './database.config.js';

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

// Meal Planning
import { createMealPlanningRouter } from './meal-planning/index.js';

// Inventory imports
import { inventoryRouter } from './inventory/index.js';
import { createSchoolManagementRouter } from './school-management/bootstrap.js';
import { clerkWebhookRouter } from './user-management/presentation/webhooks/clerk.webhook.router.js';
import { createUserManagementRouter } from './user-management/index.js';

import { apiRequireAuth } from './shared/middleware/require-auth.middleware.js';
import { attachUser } from './shared/middleware/attach-user.middleware.js';
import { requireRole } from './shared/middleware/require-role.middleware.js';
import { ROLES } from './shared/constants/roles.js';

const app = express();

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Always finish preflight before Clerk middleware to avoid auth redirects on OPTIONS.
app.use(handleCorsPreflight);

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

// Meal Planning routes
const mealPlanningRouter = createMealPlanningRouter();
app.use('/api', mealPlanningRouter);

// Inventory component routes
app.use('/api/inventory', inventoryRouter);

// User-management routes (unguarded for now by request)
const userManagementRouter = createUserManagementRouter();
app.use('/api', userManagementRouter);

// Error handlers (must be AFTER all routes)
app.use(menuManagementErrorHandler);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

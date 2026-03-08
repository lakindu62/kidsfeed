import express from 'express';
import dotenv from 'dotenv';

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
  errorHandler as menuManagementErrorHandler,
} from './menu-management/index.js';

// Inventory imports
import { inventoryRouter } from './inventory/index.js';
import { createSchoolManagementRouter } from './school-management/bootstrap.js';

const app = express();
app.use(express.json());

// School component routes
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

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

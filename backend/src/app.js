import express from 'express';
import mongoose from 'mongoose';
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

const app = express();
app.use(express.json());

// School component routes
// app.use('/api/students', studentGetRouter);

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

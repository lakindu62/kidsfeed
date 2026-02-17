import express from 'express';
import mongoose from 'mongoose';
import { studentGetRouter } from './school/index.js';
import {
  mealSessionRouter,
  mealAttendanceRouter,
  mealScanRouter,
} from './meal-distribution/index.js';

// Menu Management Imports
import { recipeRouter } from './menu-management/index.js';

const app = express();
app.use(express.json());

// School component routes
app.use('/api/students', studentGetRouter);

// Meal distribution component routes
app.use('/api/meal-sessions', mealSessionRouter);
app.use('/api/meal-attendance', mealAttendanceRouter);
app.use('/api/meal-scan', mealScanRouter);

// Menu Management routes
app.use('api/recipes', recipeRouter);

const MONGODB_URI =
  'mongodb+srv://kidsfeed_db_user:FzdVWWzt2SgTs6wz@y3s1-af-kidsfeed.wwmnexn.mongodb.net/kidsfeed?retryWrites=true&w=majority&appName=portfolio';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(3000, () => console.log('Server running on port 3000'));
  })
  .catch((err) => console.error('DB connection failed:', err));

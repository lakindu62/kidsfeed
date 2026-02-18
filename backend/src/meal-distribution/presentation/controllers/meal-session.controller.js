import express from 'express';

export const mealSessionRouter = express.Router();

mealSessionRouter.get('/', async (req, res) => {
  res.status(200).json({ message: 'List meal sessions - to be implemented' });
});

mealSessionRouter.post('/', async (req, res) => {
  res.status(201).json({ message: 'Create meal session - to be implemented' });
});

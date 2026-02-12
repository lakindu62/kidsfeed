import express from "express";

export const mealScanRouter = express.Router();

mealScanRouter.post("/", async (req, res) => {
  res.status(201).json({ message: "Scan QR - to be implemented" });
});


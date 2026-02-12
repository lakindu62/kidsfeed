import express from "express";

export const mealAttendanceRouter = express.Router();

mealAttendanceRouter.get("/", async (req, res) => {
  res
    .status(200)
    .json({ message: "List meal attendance - to be implemented" });
});

mealAttendanceRouter.post("/", async (req, res) => {
  res
    .status(201)
    .json({ message: "Mark meal attendance - to be implemented" });
});


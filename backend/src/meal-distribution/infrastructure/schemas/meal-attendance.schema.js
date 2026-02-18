import mongoose from 'mongoose';

const mealAttendanceSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    mealSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealSession',
      required: true,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'EXCUSED', 'NO_SHOW'],
      default: 'PRESENT',
    },
    servedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const MealAttendance = mongoose.model(
  'MealAttendance',
  mealAttendanceSchema
);

import mongoose from 'mongoose';

const mealSessionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    mealType: { type: String, required: true },
    schoolId: { type: String, required: true },
    grade: { type: String },
    className: { type: String },
    plannedHeadcount: { type: Number, default: 0 },
    actualServedCount: { type: Number, default: 0 },
    wastageCount: { type: Number, default: 0 },
    status: { type: String, default: 'PLANNED' },
    menuId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const MealSession = mongoose.model('MealSession', mealSessionSchema);

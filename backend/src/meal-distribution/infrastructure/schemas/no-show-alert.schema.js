import mongoose from 'mongoose';

const noShowAlertSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    schoolId: { type: String, required: true },
    periodFrom: { type: Date, required: true },
    periodTo: { type: Date, required: true },
    noShowCount: { type: Number, required: true },
    notified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const NoShowAlert = mongoose.model('NoShowAlert', noShowAlertSchema);

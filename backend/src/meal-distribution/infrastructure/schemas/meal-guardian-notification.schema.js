import mongoose from 'mongoose';

const mealGuardianNotificationSchema = new mongoose.Schema(
  {
    mealSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealSession',
      required: true,
    },
    studentId: { type: String, required: true },
    guardianEmail: { type: String },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'SKIPPED'],
      required: true,
    },
    skipReason: { type: String },
    providerMessageId: { type: String },
    errorMessage: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

mealGuardianNotificationSchema.index(
  { mealSessionId: 1, studentId: 1 },
  { unique: true }
);

export const MealGuardianNotification = mongoose.model(
  'MealGuardianNotification',
  mealGuardianNotificationSchema
);

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    role: { type: String, default: null },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      default: null,
    },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

export { UserModel };

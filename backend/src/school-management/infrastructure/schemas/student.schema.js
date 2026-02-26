import mongoose from 'mongoose';

const DIETARY_TAGS = ['Vegetarian', 'Halal', 'Nut Allergy', 'Dairy-Free', 'Gluten-Free'];

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number },
    gradeLevel: { type: String },
    photoUrl: { type: String },
    status: { type: String, enum: ['active', 'draft'], default: 'active' },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    guardian: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      emergencyContactName: { type: String },
      emergencyContactPhone: { type: String },
    },
    dietaryTags: {
      type: [String],
      enum: DIETARY_TAGS,
      default: [],
    },
    kitchenNotes: { type: String },
    qrCode: { type: String },
    qrStatus: { type: String, enum: ['pending', 'printed'], default: 'pending' },
    qrGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

studentSchema.index({ studentId: 1 });
studentSchema.index({ firstName: 1 });
studentSchema.index({ lastName: 1 });
studentSchema.index({ school: 1 });

export default mongoose.model('Student', studentSchema);

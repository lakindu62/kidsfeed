import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema(
  {
    schoolName: { type: String, required: true },
    managerEmail: { type: String, required: true },
    districtNumber: { type: String, required: true },
    region: { type: String },
    contactName: { type: String },
    contactPhone: { type: String },
  },
  { timestamps: true }
);

schoolSchema.virtual('totalStudents', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'school',
  count: true,
});

export default mongoose.model('School', schoolSchema);

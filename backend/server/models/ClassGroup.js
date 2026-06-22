import mongoose from 'mongoose';

const classGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    centerId: String,
    teacher: String,
    description: String,
    activeStatus: { type: Boolean, default: true }
  },
  { timestamps: true }
);

classGroupSchema.index({ name: 1 }, { unique: true });

export const ClassGroup = mongoose.model('ClassGroup', classGroupSchema);

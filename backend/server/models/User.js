import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['Admin', 'Teacher', 'Volunteer', 'Viewer'], default: 'Viewer' },
    googleId: String,
    avatar: String,
    centerId: String
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);

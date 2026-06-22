import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    activity: String,
    centerId: String,
    hours: Number,
    date: Date
  },
  { _id: false }
);

const volunteerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    role: String,
    assignedCenter: String,
    availability: String,
    activityLogs: [activityLogSchema]
  },
  { timestamps: true }
);

export const Volunteer = mongoose.model('Volunteer', volunteerSchema);

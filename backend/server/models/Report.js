import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    month: Number,
    year: Number,
    centerId: String,
    summary: String,
    attendanceSummary: Object,
    volunteerSummary: Object,
    progressSummary: Object,
    photoRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ActivityPhoto' }]
  },
  { timestamps: true }
);

export const Report = mongoose.model('Report', reportSchema);

import mongoose from 'mongoose';

const activityPhotoSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: String,
    caption: String,
    center: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGroup' },
    className: String,
    activity: String,
    uploadedBy: String,
    centerId: String,
    activityDate: Date,
    relatedSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession' }
  },
  { timestamps: true }
);

export const ActivityPhoto = mongoose.model('ActivityPhoto', activityPhotoSchema);

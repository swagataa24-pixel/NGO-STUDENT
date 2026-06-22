import mongoose from 'mongoose';

const activityPhotoSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: String,
    caption: String,
    center: String,
    className: String,
    activity: String,
    uploadedBy: String,
    centerId: String,
    activityDate: Date,
    relatedSessionId: String
  },
  { timestamps: true }
);

export const ActivityPhoto = mongoose.model('ActivityPhoto', activityPhotoSchema);

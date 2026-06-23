import { ActivityPhoto } from '../models/ActivityPhoto.js';
import { Report } from '../models/Report.js';
import { buildCloudinaryStubUpload, describeCloudinaryStatus, isCloudinaryConfigured, uploadToCloudinary } from './cloudinaryService.js';
import mongoose from 'mongoose';

export async function listPhotos(filters = {}, user = null) {
  const query = filters.centerId ? { centerId: filters.centerId } : {};
  
  // Teachers can only see their own photos; Admins see all
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    query.$or = [
      { uploadedBy: teacherIdentifier },
      { uploadedBy: null },
      { uploadedBy: '' }
    ];
  }
  
  return ActivityPhoto.find(query).sort({ activityDate: -1 });
}

export async function createPhoto(payload) {
  let imageUrl = payload.imageUrl || '';
  let cloudinaryPublicId = '';

  if (isCloudinaryConfigured() && imageUrl.startsWith('data:')) {
    try {
      const result = await uploadToCloudinary(imageUrl);
      imageUrl = result.url;
      cloudinaryPublicId = result.publicId;
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to local base64 storage:', err.message);
    }
  }

  const record = {
    imageUrl,
    cloudinaryPublicId,
    caption: payload.caption || '',
    center: payload.center || '',
    ...(mongoose.isValidObjectId(payload.classId) ? { classId: payload.classId } : {}),
    className: payload.className || '',
    activity: payload.activity || '',
    uploadedBy: payload.uploadedBy || '',
    centerId: payload.centerId || '',
    activityDate: payload.activityDate || new Date(),
    ...(mongoose.isValidObjectId(payload.relatedSessionId) ? { relatedSessionId: payload.relatedSessionId } : {})
  };

  const created = await ActivityPhoto.create(record);
  return {
    ...created.toObject(),
    uploadMode: describeCloudinaryStatus(),
    cloudinaryReady: isCloudinaryConfigured()
  };
}

export async function deletePhoto(id) {
  const photo = await ActivityPhoto.findById(id);
  if (!photo) return null;
  
  // Clean up any report references to this photo
  await Report.updateMany(
    { photoRefs: id },
    { $pull: { photoRefs: id } }
  );
  
  // Delete the photo
  const deleted = await ActivityPhoto.findByIdAndDelete(id);
  return deleted;
}


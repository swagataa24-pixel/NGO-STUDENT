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

export async function createPhoto(payload, user = null) {
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
  
  // Teachers can only upload photos to their own classes
  if (user && user.role === 'Teacher') {
    const { ClassGroup } = await import('../models/ClassGroup.js');
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => String(c._id));
    const classNames = teacherClasses.map(c => c.name);
    
    const isOwnClass = (payload.classId && classIds.includes(String(payload.classId))) || 
                       (payload.className && classNames.includes(payload.className));
    
    if (!isOwnClass) {
      throw new Error('You can only upload photos to your own classes.');
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
    uploadedBy: user ? (user.name || user.email) : (payload.uploadedBy || ''),
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

export async function deletePhoto(id, user = null) {
  let query = { _id: id };
  
  // Teachers can only delete their own photos
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    query.uploadedBy = teacherIdentifier;
  }
  
  const photo = await ActivityPhoto.findOne(query);
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


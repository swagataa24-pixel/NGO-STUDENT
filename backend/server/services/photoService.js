import { ActivityPhoto } from '../models/ActivityPhoto.js';
import { buildCloudinaryStubUpload, describeCloudinaryStatus, isCloudinaryConfigured, uploadToCloudinary } from './cloudinaryService.js';

export async function listPhotos(filters = {}) {
  const query = filters.centerId ? { centerId: filters.centerId } : {};
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
    className: payload.className || '',
    activity: payload.activity || '',
    uploadedBy: payload.uploadedBy || '',
    centerId: payload.centerId || '',
    activityDate: payload.activityDate || new Date(),
    relatedSessionId: payload.relatedSessionId || ''
  };

  const created = await ActivityPhoto.create(record);
  return {
    ...created.toObject(),
    uploadMode: describeCloudinaryStatus(),
    cloudinaryReady: isCloudinaryConfigured()
  };
}

export function cloudinaryReady() {
  return isCloudinaryConfigured();
}



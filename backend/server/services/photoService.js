import { ActivityPhoto } from '../models/ActivityPhoto.js';
import { buildCloudinaryStubUpload, describeCloudinaryStatus, isCloudinaryConfigured } from './cloudinaryService.js';

export async function listPhotos(filters = {}) {
  const query = filters.centerId ? { centerId: filters.centerId } : {};
  return ActivityPhoto.find(query).sort({ activityDate: -1 });
}

export async function createPhoto(payload) {
  const record = buildCloudinaryStubUpload(payload);
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


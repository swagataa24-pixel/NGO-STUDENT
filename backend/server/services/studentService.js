import { Student } from '../models/Student.js';
import { isCloudinaryConfigured, uploadToCloudinary } from './cloudinaryService.js';

async function processPhotoUrl(photoUrl) {
  if (photoUrl && photoUrl.startsWith('data:') && isCloudinaryConfigured()) {
    try {
      const result = await uploadToCloudinary(photoUrl);
      return result.url;
    } catch (err) {
      console.error('Cloudinary upload failed for student photo, falling back:', err.message);
    }
  }
  return photoUrl;
}

export async function listStudents(filters = {}) {
  const query = {};
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.activeOnly === 'true') query.activeStatus = true;
  return Student.find(query).sort({ createdAt: -1 });
}

export async function createStudent(payload) {
  if (payload.photoUrl) {
    payload.photoUrl = await processPhotoUrl(payload.photoUrl);
  }
  return Student.create(payload);
}

export async function getStudent(id) {
  return Student.findById(id);
}

export async function updateStudent(id, payload) {
  if (payload.photoUrl) {
    payload.photoUrl = await processPhotoUrl(payload.photoUrl);
  }
  return Student.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

export async function archiveStudent(id, activeStatus = false) {
  return Student.findByIdAndUpdate(id, { activeStatus }, { new: true });
}

export async function deleteStudent(id) {
  return Student.findByIdAndDelete(id);
}

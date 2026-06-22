import { ClassGroup } from '../models/ClassGroup.js';

export async function listClasses(filters = {}) {
  const query = {};
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.activeOnly === 'true') query.activeStatus = true;
  return ClassGroup.find(query).sort({ name: 1, center: 1 });
}

export async function createClass(payload) {
  return ClassGroup.create(payload);
}

export async function updateClass(id, payload) {
  return ClassGroup.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

export async function archiveClass(id, activeStatus = false) {
  return ClassGroup.findByIdAndUpdate(id, { activeStatus }, { new: true });
}

export async function deleteClass(id) {
  return ClassGroup.findByIdAndDelete(id);
}

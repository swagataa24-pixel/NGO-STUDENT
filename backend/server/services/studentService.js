import { Student } from '../models/Student.js';

export async function listStudents(filters = {}) {
  const query = {};
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.activeOnly === 'true') query.activeStatus = true;
  return Student.find(query).sort({ createdAt: -1 });
}

export async function createStudent(payload) {
  return Student.create(payload);
}

export async function getStudent(id) {
  return Student.findById(id);
}

export async function updateStudent(id, payload) {
  return Student.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

export async function archiveStudent(id, activeStatus = false) {
  return Student.findByIdAndUpdate(id, { activeStatus }, { new: true });
}

export async function deleteStudent(id) {
  return Student.findByIdAndDelete(id);
}

import { ClassGroup } from '../models/ClassGroup.js';
import { ActivityPhoto } from '../models/ActivityPhoto.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { Student } from '../models/Student.js';

export async function listClasses(filters = {}) {
  const query = {};
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.activeOnly === 'true') query.activeStatus = true;
  return ClassGroup.find(query).sort({ name: 1 });
}

export async function createClass(payload) {
  return ClassGroup.create(payload);
}

export async function updateClass(id, payload) {
  return ClassGroup.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

export async function archiveClass(id, activeStatus = false) {
  const classGroup = await ClassGroup.findByIdAndUpdate(id, { activeStatus }, { new: true });
  if (classGroup && activeStatus === false) {
    await Student.updateMany(
      { $or: [{ classId: classGroup._id }, { className: classGroup.name }] },
      { activeStatus: false }
    );
  }
  return classGroup;
}

export async function deleteClass(id) {
  const classGroup = await ClassGroup.findById(id);
  if (!classGroup) return null;

  const relatedClassQuery = {
    $or: [
      { classId: classGroup._id },
      { className: classGroup.name }
    ]
  };

  const [studentResult, attendanceResult, photoResult] = await Promise.all([
    Student.deleteMany(relatedClassQuery),
    AttendanceSession.deleteMany(relatedClassQuery),
    ActivityPhoto.deleteMany(relatedClassQuery)
  ]);
  await ClassGroup.findByIdAndDelete(id);

  return {
    classGroup,
    deleted: {
      students: studentResult.deletedCount || 0,
      attendanceSessions: attendanceResult.deletedCount || 0,
      photos: photoResult.deletedCount || 0
    }
  };
}

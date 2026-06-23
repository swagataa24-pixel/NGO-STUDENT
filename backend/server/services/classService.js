import { ClassGroup } from '../models/ClassGroup.js';
import { ActivityPhoto } from '../models/ActivityPhoto.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { Student } from '../models/Student.js';
import { Report } from '../models/Report.js';

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

  // Get photos to delete (for cleanup operations)
  const photosToDelete = await ActivityPhoto.find(relatedClassQuery).select('_id');
  const photoIds = photosToDelete.map(p => p._id);

  // Delete everything in parallel
  const [studentResult, attendanceResult, photoResult, reportResult] = await Promise.all([
    Student.deleteMany(relatedClassQuery),
    AttendanceSession.deleteMany(relatedClassQuery),
    ActivityPhoto.deleteMany(relatedClassQuery),
    // Delete reports related to this class
    Report.deleteMany({ 'attendanceSummary.className': classGroup.name })
  ]);

  // Clean up orphaned report photoRefs (in case any reports reference deleted photos)
  if (photoIds.length > 0) {
    await Report.updateMany(
      { photoRefs: { $in: photoIds } },
      { $pull: { photoRefs: { $in: photoIds } } }
    );
  }

  await ClassGroup.findByIdAndDelete(id);

  return {
    classGroup,
    deleted: {
      students: studentResult.deletedCount || 0,
      attendanceSessions: attendanceResult.deletedCount || 0,
      photos: photoResult.deletedCount || 0,
      reports: reportResult.deletedCount || 0
    }
  };
}

import { ClassGroup } from '../models/ClassGroup.js';
import { ActivityPhoto } from '../models/ActivityPhoto.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { Student } from '../models/Student.js';
import { Report } from '../models/Report.js';

export async function listClasses(filters = {}, user = null) {
  const query = {};
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.activeOnly === 'true') query.activeStatus = true;
  
  // Teachers can only see their own classes; Admins see all
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    query.teacher = teacherIdentifier;
  }
  
  return ClassGroup.find(query).sort({ name: 1 });
}

export async function createClass(payload, user = null) {
  if (user) {
    const teacherIdentifier = user.name || user.email;
    payload.teacher = teacherIdentifier;
  }
  return ClassGroup.create(payload);
}

export async function updateClass(id, payload, user = null) {
  let query = { _id: id };
  
  // Teachers can only update their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    query.teacher = teacherIdentifier;
  }
  
  return ClassGroup.findOneAndUpdate(query, payload, { new: true, runValidators: true });
}

export async function archiveClass(id, activeStatus = false, user = null) {
  let query = { _id: id };
  
  // Teachers can only archive their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    query.teacher = teacherIdentifier;
  }
  
  const classGroup = await ClassGroup.findOneAndUpdate(query, { activeStatus }, { new: true });
  if (classGroup && activeStatus === false) {
    await Student.updateMany(
      { $or: [{ classId: classGroup._id }, { className: classGroup.name }] },
      { activeStatus: false }
    );
  }
  return classGroup;
}

export async function deleteClass(id, user = null) {
  let query = { _id: id };
  
  // Teachers can only delete their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    query.teacher = teacherIdentifier;
  }
  
  const classGroup = await ClassGroup.findOne(query);
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

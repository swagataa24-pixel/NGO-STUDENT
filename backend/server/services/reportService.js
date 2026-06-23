import { ActivityPhoto } from '../models/ActivityPhoto.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { ClassGroup } from '../models/ClassGroup.js';
import { Report } from '../models/Report.js';
import { Student } from '../models/Student.js';
import { Volunteer } from '../models/Volunteer.js';
import { parseMonthYear } from '../utils/validators.js';

export async function generateMonthlyReport({ month, year, centerId, user = null }) {
  const normalized = parseMonthYear({ month, year });
  const start = new Date(normalized.year, normalized.month - 1, 1);
  const end = new Date(normalized.year, normalized.month, 1);
  const scoped = centerId ? { centerId } : {};

  // Get teacher's classes if needed
  let teacherClassIds = [];
  let teacherClassNames = [];
  let teacherIdentifier = null;
  
  if (user && user.role === 'Teacher') {
    teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    teacherClassIds = teacherClasses.map(c => c._id);
    teacherClassNames = teacherClasses.map(c => c.name);
  }

  // Build queries based on user role
  let studentQuery = { ...scoped };
  let sessionQuery = { ...scoped, date: { $gte: start, $lt: end } };
  let photoQuery = { ...scoped, activityDate: { $gte: start, $lt: end } };

  if (user && user.role === 'Teacher') {
    // Filter students to only those in teacher's classes
    studentQuery.$or = [
      { classId: { $in: teacherClassIds } },
      { className: { $in: teacherClassNames } }
    ];

    // Filter sessions to teacher's classes (or teacherId)
    sessionQuery.$or = [
      { teacherId: teacherIdentifier },
      { classId: { $in: teacherClassIds } },
      { className: { $in: teacherClassNames } }
    ];

    // Filter photos to teacher's classes or uploaded by teacher
    photoQuery.$or = [
      { uploadedBy: teacherIdentifier },
      { classId: { $in: teacherClassIds } },
      { className: { $in: teacherClassNames } }
    ];
  }

  const [students, sessions, photos, volunteers] = await Promise.all([
    Student.find(studentQuery),
    AttendanceSession.find(sessionQuery),
    ActivityPhoto.find(photoQuery),
    (user && user.role === 'Admin') ? Volunteer.find(centerId ? { assignedCenter: centerId } : {}) : [] // Only admins see volunteers
  ]);

  const presentCount = sessions.reduce((sum, session) => sum + session.presentCount, 0);
  const absentCount = sessions.reduce((sum, session) => sum + session.absentCount, 0);
  const lowAttendance = students.filter((student) => {
    const stats = student.attendanceStats || {};
    return stats.conducted > 0 && Math.round((stats.attended / stats.conducted) * 100) < 50;
  });

  return {
    month: normalized.month,
    year: normalized.year,
    centerId,
    summary: `${students.length} students, ${sessions.length} attendance sessions, ${photos.length} photo proofs.`,
    attendanceSummary: { presentCount, absentCount, sessions: sessions.length, lowAttendance: lowAttendance.length },
    volunteerSummary: { count: volunteers.length },
    progressSummary: { notes: students.reduce((sum, student) => sum + (student.progressNotes?.length || 0), 0) },
    photoRefs: photos.map((photo) => photo._id)
  };
}

export async function saveMonthlyReport(filters) {
  const report = await generateMonthlyReport(filters);
  return Report.create(report);
}

// Clean up orphaned photoRefs when photos are deleted
export async function cleanupPhotoRefs(photoIds = []) {
  if (photoIds.length === 0) return;
  const result = await Report.updateMany(
    { photoRefs: { $in: photoIds } },
    { $pull: { photoRefs: { $in: photoIds } } }
  );
  return result.modifiedCount;
}

import { ActivityPhoto } from '../models/ActivityPhoto.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { Report } from '../models/Report.js';
import { Student } from '../models/Student.js';
import { Volunteer } from '../models/Volunteer.js';
import { parseMonthYear } from '../utils/validators.js';

export async function generateMonthlyReport({ month, year, centerId }) {
  const normalized = parseMonthYear({ month, year });
  const start = new Date(normalized.year, normalized.month - 1, 1);
  const end = new Date(normalized.year, normalized.month, 1);
  const scoped = centerId ? { centerId } : {};

  const [students, sessions, photos, volunteers] = await Promise.all([
    Student.find(scoped),
    AttendanceSession.find({ ...scoped, date: { $gte: start, $lt: end } }),
    ActivityPhoto.find({ ...scoped, activityDate: { $gte: start, $lt: end } }),
    Volunteer.find(centerId ? { assignedCenter: centerId } : {})
  ]);

  const presentCount = sessions.reduce((sum, session) => sum + session.presentCount, 0);
  const absentCount = sessions.reduce((sum, session) => sum + session.absentCount, 0);
  const lowAttendance = students.filter((student) => {
    const stats = student.attendanceStats || {};
    return stats.conducted > 0 && Math.round((stats.attended / stats.conducted) * 100) < 40;
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

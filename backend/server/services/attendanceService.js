import { AttendanceSession } from '../models/AttendanceSession.js';
import { Student } from '../models/Student.js';
import mongoose from 'mongoose';

export async function listAttendance(filters = {}, user = null) {
  const query = {};
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.classId && mongoose.isValidObjectId(filters.classId)) query.classId = filters.classId;
  if (filters.className) query.className = filters.className;
  
  // Teachers can only see their own attendance sessions; Admins see all
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    query.teacherId = teacherIdentifier;
  }
  
  return AttendanceSession.find(query).sort({ date: -1 });
}

export async function createSession(payload) {
  const records = payload.records || [];
  const { classId, ...sessionPayload } = payload;
  const session = await AttendanceSession.create({
    ...sessionPayload,
    ...(mongoose.isValidObjectId(classId) ? { classId } : {}),
    totalStudents: payload.totalStudents ?? records.length,
    presentCount: payload.presentCount ?? records.filter((record) => record.status === 'present').length,
    absentCount: payload.absentCount ?? records.filter((record) => record.status === 'absent').length,
    records
  });

  await Promise.all(
    records
      .filter((record) => mongoose.isValidObjectId(record.studentId) && ['present', 'absent'].includes(record.status))
      .map((record) =>
        Student.findByIdAndUpdate(record.studentId, {
          $inc: {
            'attendanceStats.conducted': 1,
            'attendanceStats.attended': record.status === 'present' ? 1 : 0
          }
        })
      )
  );

  return session;
}

export async function recordAttendance(sessionId, payload) {
  const session = await AttendanceSession.findById(sessionId);
  if (!session) return null;

  session.records.push(payload);
  session.totalStudents = Math.max(session.totalStudents, session.records.length);
  session.presentCount = session.records.filter((record) => record.status === 'present').length;
  session.absentCount = session.records.filter((record) => record.status === 'absent').length;
  await session.save();

  if (mongoose.isValidObjectId(payload.studentId) && ['present', 'absent'].includes(payload.status)) {
    await Student.findByIdAndUpdate(payload.studentId, {
      $inc: {
        'attendanceStats.conducted': 1,
        'attendanceStats.attended': payload.status === 'present' ? 1 : 0
      }
    });
  }

  return session;
}

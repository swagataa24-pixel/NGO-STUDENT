import { AttendanceSession } from '../models/AttendanceSession.js';
import { ClassGroup } from '../models/ClassGroup.js';
import { Student } from '../models/Student.js';
import mongoose from 'mongoose';
import { httpError } from '../utils/httpError.js';

function sessionStudentScope(payload) {
  const scope = [];
  if (mongoose.isValidObjectId(payload.classId)) scope.push({ classId: payload.classId });
  if (payload.className) scope.push({ className: payload.className });
  if (!scope.length) throw httpError(400, 'A valid class is required for attendance.');
  return scope;
}

async function assertStudentsBelongToSession(records, sessionLike) {
  const ids = [...new Set(records.map((record) => String(record.studentId || '')).filter((id) => mongoose.isValidObjectId(id)))];
  if (ids.length !== records.length) throw httpError(400, 'Every attendance record must contain a valid student ID.');
  if (!ids.length) return;

  const count = await Student.countDocuments({ _id: { $in: ids }, $or: sessionStudentScope(sessionLike) });
  if (count !== ids.length) throw httpError(403, 'Every attendance record must belong to the selected class.');
}

export async function listAttendance(filters = {}, user = null) {
  const query = {};
  if (filters.centerId) query.centerId = filters.centerId;
  if (filters.classId && mongoose.isValidObjectId(filters.classId)) query.classId = filters.classId;
  if (filters.className) query.className = filters.className;
  
  // Teachers can only see attendance sessions from their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => c._id);
    const classNames = teacherClasses.map(c => c.name);
    
    query.$or = [
      { teacherId: teacherIdentifier },
      { classId: { $in: classIds } },
      { className: { $in: classNames } }
    ];
  }
  
  return AttendanceSession.find(query).sort({ date: -1 });
}

export async function createSession(payload, user = null) {
  // Teachers can only create sessions for their own classes
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => String(c._id));
    const classNames = teacherClasses.map(c => c.name);
    
    const isOwnClass = (payload.classId && classIds.includes(String(payload.classId))) || 
                       (payload.className && classNames.includes(payload.className));
    
    if (!isOwnClass) {
      throw httpError(403, 'You can only create attendance sessions for your own classes.');
    }
    
    // Set teacherId automatically
    payload.teacherId = user.id;
  }

  const records = payload.records || [];
  await assertStudentsBelongToSession(records, payload);
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

export async function recordAttendance(sessionId, payload, user = null) {
  let query = { _id: sessionId };
  
  // Teachers can only record attendance for their own sessions
  if (user && user.role === 'Teacher') {
    const teacherIdentifier = user.name || user.email;
    const teacherClasses = await ClassGroup.find({ teacher: teacherIdentifier }).select('_id name');
    const classIds = teacherClasses.map(c => c._id);
    const classNames = teacherClasses.map(c => c.name);
    
    query.$or = [
      { teacherId: teacherIdentifier },
      { classId: { $in: classIds } },
      { className: { $in: classNames } }
    ];
  }
  
  const session = await AttendanceSession.findOne(query);
  if (!session) return null;

  if (session.records.some((record) => String(record.studentId) === String(payload.studentId))) {
    throw httpError(409, 'Attendance has already been recorded for this student in this session.');
  }
  await assertStudentsBelongToSession([payload], session);

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

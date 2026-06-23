import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['present', 'absent', 'skipped'], required: true },
    note: String,
    recordedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const attendanceSessionSchema = new mongoose.Schema(
  {
    centerId: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGroup' },
    className: String,
    teacherId: String,
    date: { type: Date, default: Date.now },
    totalStudents: { type: Number, default: 0 },
    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
    records: [attendanceRecordSchema]
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

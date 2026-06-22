import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent', 'skipped'], required: true },
    note: String,
    recordedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const attendanceSessionSchema = new mongoose.Schema(
  {
    centerId: String,
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

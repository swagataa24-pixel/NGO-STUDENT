import mongoose from 'mongoose';

const progressNoteSchema = new mongoose.Schema(
  {
    category: String,
    note: String,
    teacherId: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    photoUrl: String,
    age: Number,
    gender: String,
    className: String,
    classId: String,
    centerId: String,
    guardianName: String,
    guardianContact: String,
    enrollmentDate: Date,
    attendanceStats: {
      attended: { type: Number, default: 0 },
      conducted: { type: Number, default: 0 }
    },
    progressNotes: [progressNoteSchema],
    activeStatus: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Student = mongoose.model('Student', studentSchema);

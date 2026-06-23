import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/cryptoService.js';

const ENCRYPTED_RE = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/;
const isEncrypted = (v) => typeof v === 'string' && ENCRYPTED_RE.test(v);

const SENSITIVE = ['name', 'guardianName', 'guardianContact'];

const progressNoteSchema = new mongoose.Schema(
  {
    category:  String,
    note:      String,
    teacherId: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true },   // encrypted
    photoUrl:        String,
    age:             Number,
    gender:          String,
    className:       String,
    classId:         { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGroup' },
    guardianName:    String,                              // encrypted
    guardianContact: String,                              // encrypted
    attendanceStats: {
      attended:  { type: Number, default: 0 },
      conducted: { type: Number, default: 0 }
    },
    progressNotes: [progressNoteSchema],
    activeStatus:  { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Encrypt before save
studentSchema.pre('save', function (next) {
  SENSITIVE.forEach((field) => {
    if (this[field] && this.isModified(field) && !isEncrypted(this[field])) {
      this[field] = encrypt(this[field]);
    }
  });
  // Encrypt progress notes
  if (this.isModified('progressNotes')) {
    this.progressNotes = this.progressNotes.map((n) => ({
      ...n,
      note: n.note && !isEncrypted(n.note) ? encrypt(n.note) : n.note
    }));
  }
  next();
});

studentSchema.pre('findOneAndUpdate', function (next) {
  const upd = this.getUpdate();
  SENSITIVE.forEach((field) => {
    if (upd?.[field] && !isEncrypted(upd[field])) upd[field] = encrypt(upd[field]);
  });
  next();
});

function decryptDoc(doc) {
  if (!doc) return;
  SENSITIVE.forEach((field) => { if (doc[field]) doc[field] = decrypt(doc[field]); });
  if (Array.isArray(doc.progressNotes)) {
    doc.progressNotes = doc.progressNotes.map((n) => ({ ...n, note: decrypt(n.note) }));
  }
}

studentSchema.post('save',             function (doc) { decryptDoc(doc); });
studentSchema.post('find',             function (docs) { docs.forEach(decryptDoc); });
studentSchema.post('findOne',          function (doc)  { decryptDoc(doc); });
studentSchema.post('findOneAndUpdate', function (doc)  { decryptDoc(doc); });

export const Student = mongoose.model('Student', studentSchema);

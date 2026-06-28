import mongoose from 'mongoose';
import { encrypt, decrypt, hmacIndex } from '../utils/cryptoService.js';

const ENCRYPTED_MARKER_RE = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/;

function isEncrypted(val) {
  return typeof val === 'string' && ENCRYPTED_MARKER_RE.test(val);
}

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    email:      { type: String, required: true },        // stored encrypted
    emailIndex: { type: String, required: true, unique: true }, // HMAC blind index for lookups
    role:       { type: String, enum: ['Admin', 'Teacher', 'Viewer'], default: 'Viewer' },
    googleId:   { type: String },
    avatar:     { type: String },
    accessApproved: { type: Boolean, default: false },
    isBlocked:  { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Encrypt sensitive fields before saving
userSchema.pre('save', function (next) {
  if (this.isModified('name') && !isEncrypted(this.name))    this.name    = encrypt(this.name);
  if (this.isModified('email') && !isEncrypted(this.email))  {
    this.emailIndex = hmacIndex(this.email);
    this.email   = encrypt(this.email);
  }
  if (this.isModified('avatar') && this.avatar && !isEncrypted(this.avatar)) this.avatar = encrypt(this.avatar);
  next();
});

userSchema.pre('findOneAndUpdate', function (next) {
  const upd = this.getUpdate();
  const values = upd?.$set || upd || {};
  if (values.name && !isEncrypted(values.name)) values.name = encrypt(values.name);
  if (values.email && !isEncrypted(values.email)) {
    values.emailIndex = hmacIndex(values.email);
    values.email = encrypt(values.email);
  }
  if (values.avatar && !isEncrypted(values.avatar)) values.avatar = encrypt(values.avatar);
  next();
});

// Decrypt after every find/findOne
function decryptDoc(doc) {
  if (!doc) return;
  if (doc.name)   doc.name   = decrypt(doc.name);
  if (doc.email)  doc.email  = decrypt(doc.email);
  if (doc.avatar) doc.avatar = decrypt(doc.avatar);
}

userSchema.post('save',            function (doc) { decryptDoc(doc); });
userSchema.post('find',            function (docs) { docs.forEach(decryptDoc); });
userSchema.post('findOne',         function (doc)  { decryptDoc(doc); });
userSchema.post('findOneAndUpdate',function (doc)  { decryptDoc(doc); });

export const User = mongoose.model('User', userSchema);

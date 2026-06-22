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
    password:   { type: String },                        // bcrypt hash (email/password users)
    googleId:   { type: String },
    avatar:     { type: String },
    isBlocked:  { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Encrypt sensitive fields before saving
userSchema.pre('save', function (next) {
  if (this.isModified('name') && !isEncrypted(this.name))    this.name    = encrypt(this.name);
  if (this.isModified('email') && !isEncrypted(this.email))  this.email   = encrypt(this.email);
  if (this.isModified('avatar') && this.avatar && !isEncrypted(this.avatar)) this.avatar = encrypt(this.avatar);
  next();
});

userSchema.pre('findOneAndUpdate', function (next) {
  const upd = this.getUpdate();
  if (upd?.name   && !isEncrypted(upd.name))   upd.name   = encrypt(upd.name);
  if (upd?.email  && !isEncrypted(upd.email))  { upd.emailIndex = hmacIndex(upd.email); upd.email = encrypt(upd.email); }
  if (upd?.avatar && !isEncrypted(upd.avatar)) upd.avatar = encrypt(upd.avatar);
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

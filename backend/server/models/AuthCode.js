import mongoose from 'mongoose';

const authCodeSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, expires: 0 }
  },
  { timestamps: true }
);

export const AuthCode = mongoose.model('AuthCode', authCodeSchema);

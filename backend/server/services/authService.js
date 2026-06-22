import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { hmacIndex, encrypt } from '../utils/cryptoService.js';

const SALT_ROUNDS = 12;

function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function resolveRole(email) {
  return parseAdminEmails().includes(normalizeEmail(email)) ? 'Admin' : 'Teacher';
}

export function buildToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '8h' }
  );
}

// ─── Google OAuth ──────────────────────────────────────────────────────────────

export async function resolveAuthenticatedUser(profile = {}) {
  const email = normalizeEmail(profile.email || '');
  const idx   = hmacIndex(email);

  if (!email) {
    return { id: 'unknown', email: '', name: profile.name || 'UPAY User', role: 'Viewer', avatar: '' };
  }

  try {
    const role = resolveRole(email);
    const doc  = await User.findOneAndUpdate(
      { emailIndex: idx },
      {
        $setOnInsert: { emailIndex: idx, role },
        $set: {
          name:     profile.name   || 'UPAY User',
          email,
          avatar:   profile.avatar || '',
          googleId: profile.googleId || ''
        }
      },
      { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
    );

    // Admin emails always stay Admin regardless of stored role
    if (role === 'Admin' && doc.role !== 'Admin') {
      doc.role = 'Admin';
      await User.findByIdAndUpdate(doc._id, { role: 'Admin' });
    }

    return { id: String(doc._id), email: doc.email, name: doc.name, role: doc.role, avatar: doc.avatar || '' };
  } catch (err) {
    return { id: idx, email, name: profile.name || 'UPAY User', role: resolveRole(email), avatar: '' };
  }
}

export function resolveGoogleProfile(body = {}) {
  return {
    name:     body.name     || 'UPAY User',
    email:    normalizeEmail(body.email || ''),
    avatar:   body.avatar   || '',
    googleId: body.googleId || ''
  };
}

// ─── Email / Password Auth ─────────────────────────────────────────────────────

export async function signupWithPassword({ name, email, password }) {
  const normEmail = normalizeEmail(email);
  const idx       = hmacIndex(normEmail);

  const existing = await User.findOne({ emailIndex: idx });
  if (existing) throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const role   = resolveRole(normEmail);

  const doc = await User.create({
    name,
    email:      normEmail,
    emailIndex: idx,
    password:   hashed,
    role
  });

  return { id: String(doc._id), email: doc.email, name: doc.name, role: doc.role, avatar: '' };
}

export async function signinWithPassword({ email, password }) {
  const normEmail = normalizeEmail(email);
  const idx       = hmacIndex(normEmail);

  const doc = await User.findOne({ emailIndex: idx }).select('+password');
  if (!doc) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  if (doc.isBlocked) throw Object.assign(new Error('This account has been blocked. Contact an admin.'), { status: 403 });
  if (!doc.password) throw Object.assign(new Error('This account uses Google Sign-In. Please sign in with Google.'), { status: 400 });

  const valid = await bcrypt.compare(password, doc.password);
  if (!valid) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });

  return { id: String(doc._id), email: doc.email, name: doc.name, role: doc.role, avatar: doc.avatar || '' };
}

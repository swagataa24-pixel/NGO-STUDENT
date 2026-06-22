import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const defaultRole = 'Teacher';

function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeRole(role, email) {
  if (role && ['Admin', 'Teacher', 'Volunteer', 'Viewer'].includes(role)) {
    return role;
  }

  return parseAdminEmails().includes(normalizeEmail(email)) ? 'Admin' : defaultRole;
}

function buildFallbackUser(profile = {}) {
  const email = normalizeEmail(profile.email || 'demo.teacher@upay.local');
  return {
    id: email,
    email,
    name: profile.name || 'UPAY User',
    role: normalizeRole(profile.role, email),
    avatar: profile.avatar || ''
  };
}

export function buildToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
}

export async function resolveAuthenticatedUser(profile = {}) {
  const email = normalizeEmail(profile.email || 'demo.teacher@upay.local');
  const fallbackUser = buildFallbackUser(profile);

  if (!email) {
    return fallbackUser;
  }

  try {
    const existing = await User.findOne({ email });
    const userDocument = await User.findOneAndUpdate(
      { email },
      {
        name: profile.name || existing?.name || 'UPAY User',
        email,
        role: normalizeRole(profile.role || existing?.role, email),
        googleId: profile.googleId || existing?.googleId || '',
        avatar: profile.avatar || existing?.avatar || '',
        centerId: profile.centerId || existing?.centerId || ''
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return {
      id: String(userDocument._id),
      email: userDocument.email,
      name: userDocument.name,
      role: userDocument.role,
      avatar: userDocument.avatar || '',
      centerId: userDocument.centerId || ''
    };
  } catch {
    return fallbackUser;
  }
}

export function resolveGoogleProfile(body = {}) {
  return {
    name: body.name || 'UPAY User',
    email: normalizeEmail(body.email || 'demo.teacher@upay.local'),
    role: body.role,
    avatar: body.avatar || '',
    googleId: body.googleId || ''
  };
}

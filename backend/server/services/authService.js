import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AuthCode } from '../models/AuthCode.js';
import { User } from '../models/User.js';
import { hmacIndex } from '../utils/cryptoService.js';
import { httpError } from '../utils/httpError.js';

const AUTH_CODE_TTL_MS = 2 * 60 * 1000;

function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function provisionedRole(email) {
  return parseAdminEmails().includes(normalizeEmail(email)) ? 'Admin' : 'Viewer';
}

export function publicUser(user) {
  return {
    id: String(user._id || user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar || '',
    isBlocked: Boolean(user.isBlocked)
  };
}

export function buildToken(user) {
  const secret = process.env.JWT_SECRET || 'development-only-jwt-secret';
  const safeUser = publicUser(user);
  return jwt.sign(
    { id: safeUser.id },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h', issuer: 'upayinfopvt-api', audience: 'upayinfopvt-workspace' }
  );
}

export async function resolveAuthenticatedUser(profile = {}) {
  const email = normalizeEmail(profile.email);
  if (!email) throw httpError(400, 'Google did not provide a usable email address.');

  const emailIndex = hmacIndex(email);
  const desiredRole = provisionedRole(email);
  let user = await User.findOne({ emailIndex });

  if (!user) {
    user = new User({
      name: profile.name || 'Workspace User',
      email,
      emailIndex,
      avatar: profile.avatar || '',
      googleId: profile.googleId || '',
      role: desiredRole,
      accessApproved: desiredRole === 'Admin'
    });
  } else {
    if (user.isBlocked) throw httpError(403, 'This account has been blocked. Contact an administrator.');
    if (user.googleId && profile.googleId && user.googleId !== profile.googleId) {
      throw httpError(409, 'This email is already linked to a different Google account.');
    }
    user.name = profile.name || user.name;
    user.avatar = profile.avatar || user.avatar;
    user.googleId = profile.googleId || user.googleId;
    if (desiredRole === 'Admin') {
      user.role = 'Admin';
      user.accessApproved = true;
    } else if (!user.accessApproved) {
      user.role = 'Viewer';
    }
  }

  await user.save();
  return publicUser(user);
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function createOneTimeAuthCode(user) {
  const code = crypto.randomBytes(32).toString('base64url');
  await AuthCode.create({
    codeHash: hashCode(code),
    userId: user.id,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS)
  });
  return code;
}

export async function exchangeOneTimeAuthCode(code) {
  if (typeof code !== 'string' || code.length < 32 || code.length > 128) {
    throw httpError(400, 'Invalid authentication code.');
  }

  const record = await AuthCode.findOneAndDelete({
    codeHash: hashCode(code),
    expiresAt: { $gt: new Date() }
  });
  if (!record) throw httpError(401, 'Authentication code is invalid, expired, or already used.');

  const user = await User.findById(record.userId);
  if (!user || user.isBlocked) throw httpError(403, 'This account is not allowed to sign in.');

  return { user: publicUser(user), token: buildToken(user), expiresIn: process.env.JWT_EXPIRES_IN || '1h' };
}

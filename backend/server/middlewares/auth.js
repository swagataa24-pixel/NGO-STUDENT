import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { publicUser } from '../services/authService.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-only-jwt-secret', {
      issuer: 'upayinfopvt-api',
      audience: 'upayinfopvt-workspace'
    });
    if (!mongoose.isValidObjectId(payload.id)) throw new Error('Invalid subject');

    const user = await User.findById(payload.id);
    if (!user || user.isBlocked) return res.status(401).json({ message: 'Account is unavailable or blocked.' });

    req.user = publicUser(user);
    next();
  } catch (error) {
    if (error?.name === 'MongoServerError') return next(error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission for this action.' });
    }
    return next();
  };
}

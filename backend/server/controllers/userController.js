import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { assertAllowedRole } from '../utils/validators.js';
import { hmacIndex, encrypt } from '../utils/cryptoService.js';

export async function index(_req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req, res, next) {
  try {
    assertAllowedRole(req.body.role);

    if (req.body.role === 'Admin') {
      const userToUpdate = await User.findById(req.params.id);
      if (!userToUpdate) throw httpError(404, 'User not found.');

      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      // Compare by emailIndex since email is stored encrypted
      const { hmacIndex: hi } = await import('../utils/cryptoService.js');
      const isAdmin = adminEmails.some((ae) => hmacIndex(ae) === userToUpdate.emailIndex);
      if (!isAdmin) {
        throw httpError(403, 'This user email is not authorized as an Admin in server configuration.');
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) throw httpError(404, 'User not found.');
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function blockUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) throw httpError(404, 'User not found.');
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw httpError(404, 'User not found.');
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateDetails(req, res, next) {
  try {
    const { name, email } = req.body;
    const update = {};
    if (name)  update.name = name;
    if (email) {
      update.email      = email;
      update.emailIndex = hmacIndex(String(email).trim().toLowerCase());
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: false }
    ).select('-password');
    if (!user) throw httpError(404, 'User not found.');
    res.json(user);
  } catch (error) {
    next(error);
  }
}

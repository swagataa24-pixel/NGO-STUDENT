import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { assertAllowedRole } from '../utils/validators.js';
import { hmacIndex } from '../utils/cryptoService.js';

function adminUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBlocked: Boolean(user.isBlocked),
    accessApproved: Boolean(user.accessApproved),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function index(_req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(adminUser));
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req, res, next) {
  try {
    assertAllowedRole(req.body.role);

    if (String(req.user.id) === String(req.params.id) && req.body.role !== 'Admin') {
      throw httpError(400, 'You cannot remove your own administrator access.');
    }

    if (req.body.role === 'Admin') {
      const userToUpdate = await User.findById(req.params.id);
      if (!userToUpdate) throw httpError(404, 'User not found.');

      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      // Compare by emailIndex since email is stored encrypted
      const isAdmin = adminEmails.some((ae) => hmacIndex(ae) === userToUpdate.emailIndex);
      if (!isAdmin) {
        throw httpError(403, 'This user email is not authorized as an Admin in server configuration.');
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role, accessApproved: ['Admin', 'Teacher'].includes(req.body.role) },
      { new: true, runValidators: true }
    );
    if (!user) throw httpError(404, 'User not found.');
    res.json(adminUser(user));
  } catch (error) {
    next(error);
  }
}

export async function blockUser(req, res, next) {
  try {
    if (String(req.user.id) === String(req.params.id)) throw httpError(400, 'You cannot block your own account.');
    const user = await User.findById(req.params.id);
    if (!user) throw httpError(404, 'User not found.');
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json(adminUser(user));
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    if (String(req.user.id) === String(req.params.id)) throw httpError(400, 'You cannot delete your own account.');
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
    if (email) throw httpError(400, 'Google-authenticated email addresses cannot be edited manually.');
    const update = {};
    if (name)  update.name = name;
    if (!name) throw httpError(400, 'A name is required.');
    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: false }
    );
    if (!user) throw httpError(404, 'User not found.');
    res.json(adminUser(user));
  } catch (error) {
    next(error);
  }
}

import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { assertAllowedRole } from '../utils/validators.js';

export async function index(_req, res, next) {
  try {
    res.json(await User.find().sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req, res, next) {
  try {
    assertAllowedRole(req.body.role);
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true });
    if (!user) throw httpError(404, 'User not found.');
    res.json(user);
  } catch (error) {
    next(error);
  }
}

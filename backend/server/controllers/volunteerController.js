import { Volunteer } from '../models/Volunteer.js';
import { httpError } from '../utils/httpError.js';

// Check if user is admin
function isAdmin(user) {
  return user?.role === 'Admin';
}

export async function index(req, res, next) {
  try {
    // Only admins can view volunteers (or make it public if needed, but default to admin-only for privacy)
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only admins can view volunteer data.' });
    }
    res.json(await Volunteer.find().sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    // Only admins and teachers can create volunteers (as per original route config)
    if (!req.body.name) throw httpError(400, 'Volunteer name is required.');
    res.status(201).json(await Volunteer.create(req.body));
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    // Only admins can update volunteers
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only admins can update volunteer data.' });
    }
    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!volunteer) throw httpError(404, 'Volunteer not found.');
    res.json(volunteer);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    // Only admins can delete volunteers
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only admins can delete volunteers.' });
    }
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) throw httpError(404, 'Volunteer not found.');
    res.json({ message: 'Volunteer deleted.', id: req.params.id });
  } catch (error) {
    next(error);
  }
}

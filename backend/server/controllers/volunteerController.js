import { Volunteer } from '../models/Volunteer.js';
import { httpError } from '../utils/httpError.js';

export async function index(_req, res, next) {
  try {
    res.json(await Volunteer.find().sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    if (!req.body.name) throw httpError(400, 'Volunteer name is required.');
    res.status(201).json(await Volunteer.create(req.body));
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!volunteer) throw httpError(404, 'Volunteer not found.');
    res.json(volunteer);
  } catch (error) {
    next(error);
  }
}

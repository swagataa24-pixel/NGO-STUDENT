import { Student } from '../models/Student.js';
import { httpError } from '../utils/httpError.js';

export async function index(req, res, next) {
  try {
    const student = await Student.findById(req.params.studentId).select('progressNotes name');
    if (!student) throw httpError(404, 'Student not found.');
    res.json(student.progressNotes);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    if (!req.body.note) throw httpError(400, 'Progress note is required.');
    const student = await Student.findByIdAndUpdate(
      req.params.studentId,
      { $push: { progressNotes: req.body } },
      { new: true, runValidators: true }
    );
    if (!student) throw httpError(404, 'Student not found.');
    res.status(201).json(student.progressNotes.at(-1));
  } catch (error) {
    next(error);
  }
}

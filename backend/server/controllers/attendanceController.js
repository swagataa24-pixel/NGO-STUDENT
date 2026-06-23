import * as attendanceService from '../services/attendanceService.js';
import { httpError } from '../utils/httpError.js';
import { asNonEmptyString } from '../utils/validators.js';

export async function index(req, res, next) {
  try {
    res.json(await attendanceService.listAttendance(req.query, req.user));
  } catch (error) {
    next(error);
  }
}

export async function createSession(req, res, next) {
  try {
    asNonEmptyString(req.body.className, 'Class name is required.');
    asNonEmptyString(req.body.centerId, 'Center ID is required.');
    res.status(201).json(await attendanceService.createSession(req.body));
  } catch (error) {
    next(error);
  }
}

export async function record(req, res, next) {
  try {
    if (!['present', 'absent', 'skipped'].includes(req.body.status)) throw httpError(400, 'Attendance status is invalid.');
    asNonEmptyString(req.body.studentId, 'studentId is required.');
    const session = await attendanceService.recordAttendance(req.params.id, req.body);
    if (!session) throw httpError(404, 'Attendance session not found.');
    res.json(session);
  } catch (error) {
    next(error);
  }
}

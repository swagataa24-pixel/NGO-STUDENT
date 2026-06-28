import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as attendanceController from '../controllers/attendanceController.js';

export const attendanceRouter = Router();

// All attendance routes require authentication
attendanceRouter.use(requireAuth, requireRole('Admin', 'Teacher'));
attendanceRouter.get('/', attendanceController.index);
attendanceRouter.post('/session', attendanceController.createSession);
attendanceRouter.patch('/session/:id/record', attendanceController.record);

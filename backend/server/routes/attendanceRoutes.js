import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as attendanceController from '../controllers/attendanceController.js';

export const attendanceRouter = Router();

// All attendance routes require authentication
attendanceRouter.get('/', requireAuth, attendanceController.index);
attendanceRouter.post('/session', requireAuth, attendanceController.createSession);
attendanceRouter.patch('/session/:id/record', requireAuth, attendanceController.record);

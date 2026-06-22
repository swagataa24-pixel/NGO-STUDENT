import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController.js';

export const attendanceRouter = Router();

attendanceRouter.get('/', attendanceController.index);
attendanceRouter.post('/session', attendanceController.createSession);
attendanceRouter.patch('/session/:id/record', attendanceController.record);

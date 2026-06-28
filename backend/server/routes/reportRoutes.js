import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as reportController from '../controllers/reportController.js';

export const reportRouter = Router();

// All report routes require authentication
reportRouter.use(requireAuth, requireRole('Admin', 'Teacher'));
reportRouter.get('/monthly', reportController.monthly);
reportRouter.post('/monthly/export', reportController.exportMonthly);

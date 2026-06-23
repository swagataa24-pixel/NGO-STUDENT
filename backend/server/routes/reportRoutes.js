import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as reportController from '../controllers/reportController.js';

export const reportRouter = Router();

// All report routes require authentication
reportRouter.get('/monthly', requireAuth, reportController.monthly);
reportRouter.post('/monthly/export', requireAuth, reportController.exportMonthly);

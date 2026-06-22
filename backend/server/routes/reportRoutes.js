import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';

export const reportRouter = Router();

reportRouter.get('/monthly', reportController.monthly);
reportRouter.post('/monthly/export', reportController.exportMonthly);

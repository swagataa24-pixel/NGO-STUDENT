import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as progressController from '../controllers/progressController.js';

export const progressRouter = Router();

progressRouter.use(requireAuth, requireRole('Admin', 'Teacher'));
progressRouter.get('/:studentId', progressController.index);
progressRouter.post('/:studentId', progressController.create);

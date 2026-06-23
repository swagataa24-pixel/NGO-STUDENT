import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as progressController from '../controllers/progressController.js';

export const progressRouter = Router();

progressRouter.get('/:studentId', requireAuth, progressController.index);
progressRouter.post('/:studentId', requireAuth, progressController.create);

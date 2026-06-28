import { Router } from 'express';
import * as volunteerController from '../controllers/volunteerController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const volunteerRouter = Router();

volunteerRouter.use(requireAuth, requireRole('Admin'));
volunteerRouter.get('/', volunteerController.index);
volunteerRouter.post('/', volunteerController.create);
volunteerRouter.put('/:id', volunteerController.update);
volunteerRouter.delete('/:id', volunteerController.remove);

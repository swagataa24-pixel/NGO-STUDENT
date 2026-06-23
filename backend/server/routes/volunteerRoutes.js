import { Router } from 'express';
import * as volunteerController from '../controllers/volunteerController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const volunteerRouter = Router();

volunteerRouter.get('/',        requireAuth, volunteerController.index);
volunteerRouter.post('/',       requireAuth, requireRole('Admin','Teacher'), volunteerController.create);
volunteerRouter.put('/:id',     requireAuth, requireRole('Admin','Teacher'), volunteerController.update);
volunteerRouter.delete('/:id',  requireAuth, requireRole('Admin'),           volunteerController.remove);

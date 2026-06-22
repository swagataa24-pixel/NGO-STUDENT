import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const userRouter = Router();

userRouter.get('/', requireAuth, requireRole('Admin'), userController.index);
userRouter.patch('/:id/role', requireAuth, requireRole('Admin'), userController.updateRole);

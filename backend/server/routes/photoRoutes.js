import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as photoController from '../controllers/photoController.js';

export const photoRouter = Router();

// All photo routes require authentication
photoRouter.use(requireAuth, requireRole('Admin', 'Teacher'));
photoRouter.get('/', photoController.index);
photoRouter.post('/upload', photoController.upload);
photoRouter.delete('/:id', photoController.destroy);

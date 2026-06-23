import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as photoController from '../controllers/photoController.js';

export const photoRouter = Router();

// All photo routes require authentication
photoRouter.get('/', requireAuth, photoController.index);
photoRouter.post('/upload', requireAuth, photoController.upload);
photoRouter.delete('/:id', requireAuth, photoController.destroy);

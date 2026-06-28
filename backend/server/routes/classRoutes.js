import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as classController from '../controllers/classController.js';

export const classRouter = Router();

classRouter.use(requireAuth, requireRole('Admin', 'Teacher'));
classRouter.get('/', classController.index);
classRouter.post('/', classController.create);
classRouter.put('/:id', classController.update);
classRouter.patch('/:id/archive', classController.archive);
classRouter.delete('/:id', classController.remove);

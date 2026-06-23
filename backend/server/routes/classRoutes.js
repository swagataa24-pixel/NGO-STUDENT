import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as classController from '../controllers/classController.js';

export const classRouter = Router();

classRouter.get('/', requireAuth, classController.index);
classRouter.post('/', requireAuth, classController.create);
classRouter.put('/:id', requireAuth, classController.update);
classRouter.patch('/:id/archive', requireAuth, classController.archive);
classRouter.delete('/:id', requireAuth, classController.remove);

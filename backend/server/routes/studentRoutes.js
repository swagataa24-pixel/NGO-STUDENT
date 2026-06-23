import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as studentController from '../controllers/studentController.js';

export const studentRouter = Router();

studentRouter.get('/', requireAuth, studentController.index);
studentRouter.post('/', requireAuth, studentController.create);
studentRouter.get('/:id', requireAuth, studentController.show);
studentRouter.put('/:id', requireAuth, studentController.update);
studentRouter.patch('/:id/archive', requireAuth, studentController.archive);
studentRouter.delete('/:id', requireAuth, studentController.remove);

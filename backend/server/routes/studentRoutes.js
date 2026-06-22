import { Router } from 'express';
import * as studentController from '../controllers/studentController.js';

export const studentRouter = Router();

studentRouter.get('/', studentController.index);
studentRouter.post('/', studentController.create);
studentRouter.get('/:id', studentController.show);
studentRouter.put('/:id', studentController.update);
studentRouter.patch('/:id/archive', studentController.archive);
studentRouter.delete('/:id', studentController.remove);
